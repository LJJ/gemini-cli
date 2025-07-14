//
//  BaseResponse.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/14.
//

import Foundation

// MARK: - 统一响应格式（与server端保持一致）

// 基础响应格式
struct BaseResponse<T: Codable & Sendable>: Codable, Sendable {
    let code: Int              // 状态码：200=成功，其他=错误
    let message: String        // 响应消息
    let data: T               // 业务数据
    let timestamp: String     // ISO 8601 时间戳
}

// 错误响应格式（当code != 200时）
struct ErrorResponse: Codable, Sendable {
    let code: Int              // 非200的状态码
    let message: String        // 错误消息
    let timestamp: String      // ISO 8601 时间戳
}
