//
//  CommandModels.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/4.
//

import Foundation

// MARK: - 命令执行模型

// 命令请求
struct CommandRequest: Codable {
    let command: String
    let cwd: String?
}

// MARK: - 业务数据模型（用于 BaseResponse<T> 的泛型参数）

// 命令执行数据
struct CommandData: Codable {
    let command: String
    let output: String
    let stderr: String?  // 重命名为stderr避免与BaseResponse.error冲突
    let exitCode: Int
} 