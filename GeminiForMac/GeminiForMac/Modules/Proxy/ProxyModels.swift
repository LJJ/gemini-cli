//
//  ProxyModels.swift
//  GeminiForMac
//
//  Created by AI Assistant on 2025/7/15.
//

import Foundation

// MARK: - 代理配置模型
struct ProxyConfig: Codable, Sendable {
    let enabled: Bool
    let host: String?
    let port: Int?
    let type: String?
    let lastUpdated: TimeInterval
}

// MARK: - 代理测试数据模型
struct ProxyTestData: Codable, Sendable {
    let working: Bool
}

// MARK: - 代理设置请求模型
struct ProxyConfigRequest: Codable {
    let enabled: Bool
    let host: String?
    let port: Int?
    let type: String?
    
    init(enabled: Bool, host: String? = nil, port: Int? = nil, type: String? = "http") {
        self.enabled = enabled
        self.host = host
        self.port = port
        self.type = type
    }
}