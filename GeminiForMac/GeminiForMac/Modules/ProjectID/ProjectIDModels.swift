//
//  ProjectIDModels.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/16.
//

import Foundation

// MARK: - 项目ID配置模型
struct ProjectIDConfig: Codable, Sendable {
    let projectId: String?
    let lastUpdated: TimeInterval
    let isConfigured: Bool
}

// MARK: - 项目ID设置请求模型
struct ProjectIDConfigRequest: Codable {
    let projectId: String
    
    init(projectId: String) {
        self.projectId = projectId
    }
}

// MARK: - 项目ID设置响应模型
struct ProjectIDConfigResponse: Codable {
    let success: Bool
    let projectId: String?
    let message: String?
}