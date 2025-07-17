//
//  ErrorCode.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/9.
//

import Foundation
import SwiftUICore

// MARK: - 错误代码枚举
// 与后端 API 规范完全一致

enum ErrorCode: String, Codable, CaseIterable {
    // 验证错误
    case validationError = "VALIDATION_ERROR"
    
    // 认证相关错误
    case authNotSet = "AUTH_NOT_SET"
    case authRequired = "AUTH_REQUIRED"
    case authConfigFailed = "AUTH_CONFIG_FAILED"
    case oauthInitFailed = "OAUTH_INIT_FAILED"
    case googleCloudProjectRequired = "GOOGLE_CLOUD_PROJECT_REQUIRED"
    
    // 网络连接错误
    case networkConnectivityFailed = "NETWORK_CONNECTIVITY_FAILED"
    
    // 客户端初始化错误
    case clientNotInitialized = "CLIENT_NOT_INITIALIZED"
    case clientInitFailed = "CLIENT_INIT_FAILED"
    
    // 流式处理错误
    case streamError = "STREAM_ERROR"
    case turnNotInitialized = "TURN_NOT_INITIALIZED"
    case abortControllerNotInitialized = "ABORT_CONTROLLER_NOT_INITIALIZED"
    
    // Gemini API 错误
    case geminiError = "GEMINI_ERROR"
    case quotaExceeded = "QUOTA_EXCEEDED"
    
    // 工具相关错误
    case toolSchedulerNotInitialized = "TOOL_SCHEDULER_NOT_INITIALIZED"
    case toolCallNotFound = "TOOL_CALL_NOT_FOUND"
    case toolInvalidOutcome = "TOOL_INVALID_OUTCOME"
    
    // 通用错误
    case internalError = "INTERNAL_ERROR"
    case networkError = "NETWORK_ERROR"
    case unknownError = "UNKNOWN_ERROR"
}



// MARK: - 错误处理扩展
extension ErrorCode {
    /// 是否需要用户重新认证
    var requiresReauthentication: Bool {
        switch self {
        case .authRequired, .authNotSet, .authConfigFailed, .oauthInitFailed:
            return true
        default:
            return false
        }
    }
    
    /// 是否需要用户检查网络连接
    var requiresNetworkCheck: Bool {
        switch self {
        case .networkError, .clientInitFailed, .oauthInitFailed:
            return true
        default:
            return false
        }
    }
    
    /// 是否需要用户配置代理设置
    var requiresProxyConfiguration: Bool {
        switch self {
        case .networkConnectivityFailed:
            return true
        default:
            return false
        }
    }
    
    /// 是否需要用户重试操作
    var requiresRetry: Bool {
        switch self {
        case .streamError, .internalError, .geminiError, .clientInitFailed:
            return true
        default:
            return false
        }
    }
    
    /// 是否需要用户检查输入参数
    var requiresInputValidation: Bool {
        switch self {
        case .validationError, .toolInvalidOutcome:
            return true
        default:
            return false
        }
    }
    
    /// 是否需要用户配置项目设置
    var requiresProjectConfiguration: Bool {
        switch self {
        case .googleCloudProjectRequired:
            return true
        default:
            return false
        }
    }
    

} 
