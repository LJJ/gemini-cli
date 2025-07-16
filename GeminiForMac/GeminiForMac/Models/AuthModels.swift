//
//  AuthModels.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/9.
//

import Foundation

// MARK: - 认证类型
enum AuthType: String, Codable, CaseIterable {
    case loginWithGoogle = "oauth-personal"
    case useGemini = "gemini-api-key"
    case useVertexAI = "vertex-ai"
    
    var displayName: String {
        switch self {
        case .loginWithGoogle:
            return "Google 账号登录"
        case .useGemini:
            return "Gemini API Key"
        case .useVertexAI:
            return "Vertex AI"
        }
    }
    
    var description: String {
        switch self {
        case .loginWithGoogle:
            return "使用 Google 账号进行 OAuth 认证"
        case .useGemini:
            return "使用 Gemini API Key 进行认证"
        case .useVertexAI:
            return "使用 Google Cloud Vertex AI 进行认证"
        }
    }
}

// MARK: - 认证状态
enum AuthStatus: Equatable {
    case notAuthenticated
    case authenticating
    case authenticated
    case error(String)
    
    static func == (lhs: AuthStatus, rhs: AuthStatus) -> Bool {
        switch (lhs, rhs) {
        case (.notAuthenticated, .notAuthenticated),
             (.authenticating, .authenticating),
             (.authenticated, .authenticated):
            return true
        case (.error(let lhsError), .error(let rhsError)):
            return lhsError == rhsError
        default:
            return false
        }
    }
}

// MARK: - 认证配置
struct AuthConfig: Codable {
    let authType: AuthType
    let apiKey: String?
    let googleCloudProject: String?
    let googleCloudLocation: String?
    
    init(authType: AuthType, apiKey: String? = nil, googleCloudProject: String? = nil, googleCloudLocation: String? = nil) {
        self.authType = authType
        self.apiKey = apiKey
        self.googleCloudProject = googleCloudProject
        self.googleCloudLocation = googleCloudLocation
    }
}

// MARK: - 业务数据模型（用于 BaseResponse<T> 的泛型参数）

// 认证响应数据
struct AuthResponseData: Codable {
    let message: String
}

// 认证状态数据
struct AuthStatusData: Codable {
    let isAuthenticated: Bool
    let authType: String?
    let hasApiKey: Bool
    let hasGoogleCloudConfig: Bool
}

// Google 授权 URL 数据
struct GoogleAuthUrlData: Codable {
    let authUrl: String
}
