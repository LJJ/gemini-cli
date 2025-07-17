//
//  FileExplorerVM.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/14.
//

import Foundation
import SwiftUI
import Factory

// MARK: - DirectoryItem Extensions
extension DirectoryItem {
    var isDirectory: Bool {
        return type == "directory"
    }
    
    var isFile: Bool {
        return type == "file"
    }
}

@MainActor
class FileExplorerVM: ObservableObject {
    @Injected(\.fileExplorerService) private var fileExplorerService
    private let apiService = APIService()
    
    // MARK: - Published Properties (UI State)
    @Published var items: [DirectoryItem] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var searchText = ""
    
    // MARK: - Internal State
    @Published private var navigationState = NavigationState()
    @Published private var selectionState = SelectionState()
    @Published private var expansionState = ExpansionState()
    
    // MARK: - Computed Properties
    var currentPath: String {
        return navigationState.currentPath
    }
    
    var canGoBack: Bool {
        return navigationState.canGoBack
    }
    
    var canGoForward: Bool {
        return navigationState.canGoForward
    }
    
    var selectedFiles: Set<String> {
        return selectionState.selectedFiles
    }
    
    var hasSelection: Bool {
        return !selectionState.isEmpty
    }
    
    var selectionStats: (directories: Int, files: Int) {
        return selectionState.getStats(from: items)
    }
    
    var selectedFileItems: [DirectoryItem] {
        return selectionState.getSelectedItems(from: items)
    }
    
    var filteredItems: [DirectoryItem] {
        if searchText.isEmpty {
            return items
        } else {
            return items.filter { item in
                item.name.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    // MARK: - Initialization
    init() {
        // 同步Service中的选择状态
        syncWithService()
        loadCurrentDirectory()
    }
    
    // MARK: - Service Synchronization
    private func syncWithService() {
        // 从Service获取当前选择状态
        selectionState.selectedFiles = fileExplorerService.selectedFiles
        navigationState.currentPath = fileExplorerService.currentPath
    }
    
    private func syncToService() {
        // 将本地选择状态同步到Service
        fileExplorerService.selectedFiles = selectionState.selectedFiles
        fileExplorerService.currentPath = navigationState.currentPath
    }
    
    // MARK: - Directory Operations
    func loadCurrentDirectory() {
        Task {
            await loadDirectory(path: navigationState.currentPath)
        }
    }
    
    func loadDirectory(path: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            if let response = await apiService.listDirectory(path: path) {
                navigationState.currentPath = response.path
                // currentPath = response.path  // 更新published的currentPath // Removed
                items = sortItems(response.items)
                
                // 添加到历史记录
                navigationState.addToHistory(path)
                
                // 同步到Service
                syncToService()
            } else {
                errorMessage = String(localized: "无法加载目录内容")
            }
        } catch {
            errorMessage = String(format: String(localized: "加载目录失败: %@"), error.localizedDescription)
        }
        
        isLoading = false
    }
    
    func loadSubDirectory(for item: DirectoryItem) async {
        guard item.isDirectory else { return }
        
        do {
            if let response = await apiService.listDirectory(path: item.path) {
                let sortedChildren = sortItems(response.items)
                // 递归更新items中的对应项目
                updateItemChildren(in: &items, targetItem: item, newChildren: sortedChildren)
                
                // 检查新加载的子项目中是否有之前展开的目录，如果有则自动加载其内容
                await restoreExpandedSubDirectories(in: sortedChildren)
            }
        } catch {
            print("加载子目录失败: \(error.localizedDescription)")
        }
    }
    
    // 恢复已展开的子目录内容
    private func restoreExpandedSubDirectories(in children: [DirectoryItem]) async {
        for child in children {
            if child.isDirectory && expansionState.isExpanded(child.path) {
                print("🔄 恢复展开状态: \(child.name)")
                await loadSubDirectory(for: child)
            }
        }
    }
    
    // 递归更新items中指定项目的children
    private func updateItemChildren(in items: inout [DirectoryItem], targetItem: DirectoryItem, newChildren: [DirectoryItem]) {
        for index in items.indices {
            if items[index].id == targetItem.id {
                items[index].children = newChildren
                return
            }
            
            // 如果当前项目有子项目，递归搜索
            if var children = items[index].children {
                updateItemChildren(in: &children, targetItem: targetItem, newChildren: newChildren)
                items[index].children = children
            }
        }
    }
    
    private func sortItems(_ items: [DirectoryItem]) -> [DirectoryItem] {
        return items.sorted { item1, item2 in
            // 文件夹在前，然后按名称排序
            if item1.isDirectory && item2.isFile {
                return true
            } else if item1.isFile && item2.isDirectory {
                return false
            } else {
                return item1.name.localizedCaseInsensitiveCompare(item2.name) == .orderedAscending
            }
        }
    }
    
    // MARK: - Navigation
    func navigateToParent() {
        let parentPath = (navigationState.currentPath as NSString).deletingLastPathComponent
        if parentPath.isEmpty || parentPath == "." {
            return
        }
        Task {
            await loadDirectory(path: parentPath)
        }
    }
    
    func navigateToDirectory(_ item: DirectoryItem) {
        guard item.isDirectory else { return }
        print("🔄 双击进入目录: \(item.name) - \(item.path)")
        Task {
            await loadDirectory(path: item.path)
        }
    }
    
    func goBack() {
        guard let path = navigationState.goBack() else { return }
        Task {
            await loadDirectory(path: path)
        }
    }
    
    func goForward() {
        guard let path = navigationState.goForward() else { return }
        Task {
            await loadDirectory(path: path)
        }
    }
    
    // MARK: - Selection Operations
    func toggleSelection(_ item: DirectoryItem) {
        selectionState.toggle(item.path)
        syncToService()
    }
    
    func isFileSelected(_ item: DirectoryItem) -> Bool {
        return selectionState.contains(item.path)
    }
    
    func clearSelection() {
        selectionState.clear()
        syncToService()
    }
    
    // MARK: - Expansion Operations
    func toggleFolderExpansion(_ item: DirectoryItem) {
        guard item.isDirectory else { return }
        
        if expansionState.isExpanded(item.path) {
            // 折叠文件夹
            expansionState.collapse(item.path)
            // 递归清空子项目（但保留展开状态记录）
            clearItemChildren(in: &items, targetItem: item)
        } else {
            // 展开文件夹
            expansionState.expand(item.path)
            // 加载子目录
            Task {
                await loadSubDirectory(for: item)
            }
        }
    }
    
    // 递归清空items中指定项目的children
    private func clearItemChildren(in items: inout [DirectoryItem], targetItem: DirectoryItem) {
        for index in items.indices {
            if items[index].id == targetItem.id {
                items[index].children = nil
                return
            }
            
            // 如果当前项目有子项目，递归搜索
            if var children = items[index].children {
                clearItemChildren(in: &children, targetItem: targetItem)
                items[index].children = children
            }
        }
    }
    
    func isFolderExpanded(_ item: DirectoryItem) -> Bool {
        return expansionState.isExpanded(item.path)
    }
    
    // MARK: - Utility Operations
    func refresh() {
        loadCurrentDirectory()
    }
    
    func searchFiles(query: String) {
        searchText = query
        // 这里可以实现更复杂的搜索功能
        // 比如服务器端搜索等
    }
    
    func clearSearch() {
        searchText = ""
    }
}
