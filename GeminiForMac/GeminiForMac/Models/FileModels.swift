//
//  FileModels.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/4.
//

import Foundation

// MARK: - 文件操作模型

// 目录项
struct DirectoryItem: Codable, Identifiable {
    let id = UUID()
    let name: String
    let type: String // "directory" 或 "file"
    let path: String
    var children: [DirectoryItem]? // 子项目，用于展开的文件夹
    
    enum CodingKeys: String, CodingKey {
        case name, type, path, children
    }
    
    // 初始化方法
    init(name: String, type: String, path: String, children: [DirectoryItem]? = nil) {
        self.name = name
        self.type = type
        self.path = path
        self.children = children
    }
}

// MARK: - 业务数据模型（用于 BaseResponse<T> 的泛型参数）

// 目录列表数据
struct DirectoryData: Codable {
    let path: String
    let items: [DirectoryItem]
}

// 文件操作数据
struct FileData: Codable {
    let path: String
    let content: String?
    let message: String?
}

// 文件请求
struct FileRequest: Codable {
    let path: String
}

// 文件写入请求
struct FileWriteRequest: Codable {
    let path: String
    let content: String
} 
