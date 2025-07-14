//
//  ChatModels.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/4.
//

import Foundation

enum ChatMessageType: Int, Codable {
    case user
    case text
    case image
}

// MARK: - 聊天消息模型
struct ChatMessage: Identifiable, Codable {
    let id = UUID()
    let content: String
    let type: ChatMessageType
    let timestamp: Date
    
    init(content: String, type: ChatMessageType, timestamp: Date = Date()) {
        self.content = content
        self.type = type
        self.timestamp = timestamp
    }
    
    var isUser: Bool {
        type == .user
    }
}

// MARK: - 聊天API模型

// 聊天请求
struct ChatRequest: Codable {
    let message: String
    let stream: Bool?
    let filePaths: [String]?
    let workspacePath: String?
}

// 聊天响应数据（用于BaseResponse<T>的泛型参数）
struct ChatResponseData: Codable {
    let response: String
    let hasToolCalls: Bool?
    let toolCalls: [ToolCall]?
}

// 工具调用
struct ToolCall: Codable {
    let id: String
    let name: String
    let args: [String: String]  // 简化为字符串字典
}

// 状态响应数据（用于BaseResponse<T>的泛型参数）
struct StatusResponseData: Codable {
    let status: String
    let version: String
}
