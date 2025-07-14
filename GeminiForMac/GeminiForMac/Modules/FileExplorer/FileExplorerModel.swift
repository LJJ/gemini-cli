//
//  FileExplorerModel.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/14.
//

import Foundation

// MARK: - Directory Models (使用现有的DirectoryItem和DirectoryResponse定义)

// MARK: - Navigation Models

struct NavigationState {
    var currentPath: String = "."
    var pathHistory: [String] = []
    var currentHistoryIndex: Int = -1
    
    var canGoBack: Bool {
        return currentHistoryIndex > 0
    }
    
    var canGoForward: Bool {
        return currentHistoryIndex < pathHistory.count - 1
    }
    
    mutating func addToHistory(_ path: String) {
        // 如果当前不在历史记录的最后，删除后面的记录
        if currentHistoryIndex < pathHistory.count - 1 {
            pathHistory = Array(pathHistory.prefix(currentHistoryIndex + 1))
        }
        
        // 添加新路径
        pathHistory.append(path)
        currentHistoryIndex = pathHistory.count - 1
    }
    
    mutating func goBack() -> String? {
        guard canGoBack else { return nil }
        currentHistoryIndex -= 1
        return pathHistory[currentHistoryIndex]
    }
    
    mutating func goForward() -> String? {
        guard canGoForward else { return nil }
        currentHistoryIndex += 1
        return pathHistory[currentHistoryIndex]
    }
}

// MARK: - Selection Models

struct SelectionState {
    var selectedFiles: Set<String> = []
    
    var isEmpty: Bool {
        return selectedFiles.isEmpty
    }
    
    func contains(_ path: String) -> Bool {
        return selectedFiles.contains(path)
    }
    
    mutating func toggle(_ path: String) {
        if selectedFiles.contains(path) {
            selectedFiles.remove(path)
        } else {
            selectedFiles.insert(path)
        }
    }
    
    mutating func select(_ path: String) {
        selectedFiles.removeAll()
        selectedFiles.insert(path)
    }
    
    mutating func clear() {
        selectedFiles.removeAll()
    }
    
    func getStats(from items: [DirectoryItem]) -> (directories: Int, files: Int) {
        var dirCount = 0
        var fileCount = 0
        
        print("🔍 开始统计选择状态，共有选择项: \(selectedFiles.count)")
        
        for path in selectedFiles {
            print("🔍 检查路径: \(path)")
            if let item = findItem(in: items, path: path) {
                print("✅ 找到项目: \(item.name), 类型: \(item.type)")
                if item.isDirectory {
                    dirCount += 1
                } else {
                    fileCount += 1
                }
            } else {
                print("❌ 未找到项目，路径: \(path)")
                // 备用方案：根据文件扩展名判断
                let fileName = (path as NSString).lastPathComponent
                let hasExtension = fileName.contains(".")
                if hasExtension {
                    print("📄 推测为文件: \(fileName)")
                    fileCount += 1
                } else {
                    print("📁 推测为目录: \(fileName)")
                    dirCount += 1
                }
            }
        }
        
        print("📊 统计结果: 目录=\(dirCount), 文件=\(fileCount)")
        return (directories: dirCount, files: fileCount)
    }
    
    // 递归查找指定路径的项目
    private func findItem(in items: [DirectoryItem], path: String) -> DirectoryItem? {
        for item in items {
            if item.path == path {
                return item
            }
            
            // 如果有子项目，递归查找
            if let children = item.children {
                if let found = findItem(in: children, path: path) {
                    return found
                }
            }
        }
        return nil
    }
    
    func getSelectedItems(from items: [DirectoryItem]) -> [DirectoryItem] {
        var result: [DirectoryItem] = []
        
        for path in selectedFiles {
            if let item = findItem(in: items, path: path) {
                result.append(item)
            }
        }
        
        return result
    }
}

// MARK: - Expansion Models

struct ExpansionState {
    var expandedFolders: Set<String> = []
    
    func isExpanded(_ path: String) -> Bool {
        return expandedFolders.contains(path)
    }
    
    mutating func toggle(_ path: String) {
        if expandedFolders.contains(path) {
            expandedFolders.remove(path)
        } else {
            expandedFolders.insert(path)
        }
    }
    
    mutating func expand(_ path: String) {
        expandedFolders.insert(path)
    }
    
    mutating func collapse(_ path: String) {
        expandedFolders.remove(path)
    }
}
