//
//  FileExplorerService.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/4.
//  Refactored by LJJ on 2025/7/14.
//

import Foundation
import SwiftUI

@MainActor
class FileExplorerService: ObservableObject {
    // MARK: - Shared Data (需要与其他模块同步的数据)
    @Published var currentPath = "."
    @Published var selectedFiles: Set<String> = []
    
    // MARK: - Computed Properties for Other Modules
    
    /// 获取选中的文件路径数组（供ChatService等使用）
    var selectedFilePaths: [String] {
        return Array(selectedFiles)
    }
    
    /// 检查是否有选中的文件
    var hasSelectedFiles: Bool {
        return !selectedFiles.isEmpty
    }
    
    /// 获取选中文件的数量
    var selectedFileCount: Int {
        return selectedFiles.count
    }
    
    // MARK: - Public Methods (供其他模块调用)
    
    /// 清空所有选择（供其他模块调用）
    func clearAllSelection() {
        selectedFiles.removeAll()
    }
    
    /// 添加文件到选择列表（供其他模块调用）
    func addToSelection(_ filePath: String) {
        selectedFiles.insert(filePath)
    }
    
    /// 从选择列表中移除文件（供其他模块调用）
    func removeFromSelection(_ filePath: String) {
        selectedFiles.remove(filePath)
    }
    
    /// 设置当前工作目录（供其他模块调用）
    func setCurrentPath(_ path: String) {
        currentPath = path
    }
    
    /// 检查文件是否被选中（供其他模块调用）
    func isSelected(_ filePath: String) -> Bool {
        return selectedFiles.contains(filePath)
    }
    
    // MARK: - Notification Methods
    
    /// 通知选择状态发生变化（供ViewModel调用）
    func notifySelectionChanged(_ newSelection: Set<String>) {
        if selectedFiles != newSelection {
            selectedFiles = newSelection
        }
    }
    
    /// 通知路径发生变化（供ViewModel调用）
    func notifyPathChanged(_ newPath: String) {
        if currentPath != newPath {
            currentPath = newPath
        }
    }
} 
