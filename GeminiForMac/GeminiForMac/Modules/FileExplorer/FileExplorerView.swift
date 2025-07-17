//
//  FileExplorerView.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/4.
//  Refactored by LJJ on 2025/7/14.
//

import SwiftUI
import Factory

struct FileExplorerView: View {
    @StateObject private var fileExplorerVM = FileExplorerVM()
    @ObservedObject private var chatService = Container.shared.chatService.resolve()
    
    var body: some View {
        VStack(spacing: 0) {
            // 顶部工具栏
            FileExplorerToolbar(viewModel: fileExplorerVM)
            
            Divider()
            
            // 工作区信息显示
            WorkspaceDisplayBar(
                workspacePath: chatService.currentWorkspace,
                currentPath: chatService.currentPath
            )
            Divider()
            
            // 选择状态显示
            if fileExplorerVM.hasSelection {
                SelectionStatusBar(viewModel: fileExplorerVM)
                Divider()
            }
            
            // 搜索框
            SearchBar(searchText: $fileExplorerVM.searchText, onClear: {
                fileExplorerVM.clearSearch()
            })
            
            Divider()
            
            // 当前路径显示
            PathDisplayBar(currentPath: fileExplorerVM.currentPath)
            
            Divider()
            
            // 文件列表
            FileListContent(viewModel: fileExplorerVM)
        }
        .frame(minWidth: 200, maxWidth: 300)
        .background(Color(NSColor.controlBackgroundColor))
    }
}

// MARK: - Subviews

struct FileExplorerToolbar: View {
    @ObservedObject var viewModel: FileExplorerVM
    
    var body: some View {
        HStack(spacing: 8) {
            // 后退按钮
            Button(action: {
                viewModel.goBack()
            }) {
                Image(systemName: "chevron.left")
                    .font(.caption)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .contentShape(.rect)
            }
            .disabled(!viewModel.canGoBack)
            .buttonStyle(.plain)
            
            // 前进按钮
            Button(action: {
                viewModel.goForward()
            }) {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .contentShape(.rect)
            }
            .disabled(!viewModel.canGoForward)
            .buttonStyle(.plain)
            
            // 父目录按钮
            Button(action: {
                viewModel.navigateToParent()
            }) {
                Image(systemName: "arrow.up")
                    .font(.caption)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            
            Divider()
                .frame(height: 16)
            
            // 刷新按钮
            Button(action: {
                viewModel.refresh()
            }) {
                Image(systemName: "arrow.clockwise")
                    .font(.caption)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            
            Spacer()
            
            // 标题
            Text("文件浏览器")
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(NSColor.controlBackgroundColor))
    }
}

struct SelectionStatusBar: View {
    @ObservedObject var viewModel: FileExplorerVM
    
    private var statsText: String {
        let stats = viewModel.selectionStats
        print("📊 选择统计: 目录=\(stats.directories), 文件=\(stats.files), 总选择=\(viewModel.selectedFiles.count)")
        
        var components: [String] = []
        if stats.directories > 0 {
            components.append("\(stats.directories) 个目录")
        }
        if stats.files > 0 {
            components.append("\(stats.files) 个文件")
        }
        
        if components.isEmpty {
            return "\(viewModel.selectedFiles.count) 项"
        }
        
        return components.joined(separator: "，")
    }
    
    var body: some View {
        HStack {
            Text("已选择")
                .font(.caption2)
                .foregroundColor(.blue)
            
            Spacer()
            
            Text(statsText)
                .font(.caption2)
                .foregroundColor(.secondary)
            
            Button("清空") {
                viewModel.clearSelection()
            }
            .buttonStyle(.plain)
            .font(.caption2)
            .foregroundColor(.red)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 4)
        .background(Color.blue.opacity(0.1))
    }
}

struct SearchBar: View {
    @Binding var searchText: String
    let onClear: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .font(.caption)
                .foregroundColor(.secondary)
            
            TextField(String(localized: "搜索文件..."), text: $searchText)
                .textFieldStyle(.plain)
                .font(.caption)
            
            if !searchText.isEmpty {
                Button(action: onClear) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(NSColor.controlBackgroundColor))
    }
}

struct PathDisplayBar: View {
    let currentPath: String
    
    var body: some View {
        HStack {
            Text(currentPath)
                .font(.caption2)
                .foregroundColor(.secondary)
                .lineLimit(1)
                .truncationMode(.middle)
            
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 4)
        .background(Color(NSColor.controlBackgroundColor))
    }
}

struct WorkspaceDisplayBar: View {
    let workspacePath: String
    let currentPath: String
    @ObservedObject private var chatService = Container.shared.chatService.resolve()
    
    private var isInWorkspace: Bool {
        return currentPath.hasPrefix(workspacePath)
    }
    
    private var relativePath: String {
        if isInWorkspace && currentPath != workspacePath {
            let relative = String(currentPath.dropFirst(workspacePath.count))
            return relative.hasPrefix("/") ? String(relative.dropFirst()) : relative
        }
        return ""
    }
    
    var body: some View {
        VStack(spacing: 2) {
            // 工作区路径
            HStack {
                Image(systemName: "folder")
                    .font(.caption2)
                    .foregroundColor(.blue)
                
                Text("工作区:")
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundColor(.blue)
                
                if workspacePath.isEmpty {
                    Text("未设置")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .italic()
                } else {
                    Text(workspacePath)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
                
                Spacer()
            }
            
            // 相对路径（如果在工作区内）
            if !relativePath.isEmpty {
                HStack {
                    Image(systemName: "arrow.right")
                        .font(.caption2)
                        .foregroundColor(.green)
                    
                    Text(relativePath)
                        .font(.caption2)
                        .foregroundColor(.green)
                        .lineLimit(1)
                        .truncationMode(.middle)
                    
                    Spacer()
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 4)
        .background(Color.blue.opacity(0.05))
    }
}

struct FileListContent: View {
    @ObservedObject var viewModel: FileExplorerVM
    
    var body: some View {
        if viewModel.isLoading {
            VStack {
                ProgressView()
                    .scaleEffect(0.8)
                Text("加载中...")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let errorMessage = viewModel.errorMessage {
            VStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundColor(.orange)
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                
                Button("重试") {
                    viewModel.refresh()
                }
                .buttonStyle(.plain)
                .font(.caption)
            }
            .padding()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(viewModel.filteredItems) { item in
                        RecursiveFileItemView(
                            item: item,
                            viewModel: viewModel,
                            level: 0
                        )
                    }
                }
            }
        }
    }
}

// 递归文件项视图
struct RecursiveFileItemView: View {
    let item: DirectoryItem
    @ObservedObject var viewModel: FileExplorerVM
    let level: Int
    
    var body: some View {
        VStack(spacing: 0) {
            // 当前项目
            FileItemView(
                item: item,
                isSelected: viewModel.isFileSelected(item),
                isExpanded: viewModel.isFolderExpanded(item),
                level: level
            ) {
                // 单击处理：切换选择状态（多选模式）
                viewModel.toggleSelection(item)
            } onDoubleTap: {
                // 双击：进入目录（仅对文件夹）
                if item.isDirectory {
                    viewModel.navigateToDirectory(item)
                }
            } onToggleExpansion: {
                viewModel.toggleFolderExpansion(item)
            }
            
            // 子项目（如果展开且有子项目）
            if viewModel.isFolderExpanded(item),
               let children = item.children {
                ForEach(filteredChildren(children)) { childItem in
                    RecursiveFileItemView(
                        item: childItem,
                        viewModel: viewModel,
                        level: level + 1
                    )
                }
            }
        }
    }
    
    // 过滤子项目
    private func filteredChildren(_ children: [DirectoryItem]) -> [DirectoryItem] {
        if viewModel.searchText.isEmpty {
            return children
        } else {
            return children.filter { item in
                item.name.localizedCaseInsensitiveContains(viewModel.searchText)
            }
        }
    }
}

#Preview {
    FileExplorerView()
}
