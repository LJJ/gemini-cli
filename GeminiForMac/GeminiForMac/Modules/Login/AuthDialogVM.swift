//
//  AuthDialogVM.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/16.
//

import Foundation
import SwiftUI
import Factory

@MainActor
class AuthDialogVM: ObservableObject {
    @Injected(\.authService) private var authService
    
    // MARK: - UI State
    @Published var selectedAuthType: AuthType = .loginWithGoogle
    @Published var apiKey = ""
    @Published var googleCloudProject = ""
    @Published var googleCloudLocation = ""
    @Published var validationError: String?
    
    // MARK: - Computed Properties
    var isAuthenticating: Bool {
        if case .authenticating = authService.authStatus {
            return true
        }
        return false
    }
    
    var canAuthenticate: Bool {
        return !isAuthenticating && validationError == nil
    }
    
    // MARK: - Public Methods
    
    /// 选择认证方式
    func selectAuthType(_ authType: AuthType) {
        selectedAuthType = authType
        clearValidationError()
    }
    
    /// 清除验证错误
    func clearValidationError() {
        validationError = nil
    }
    
    /// 验证输入
    func validateInput() -> Bool {
        let error = validateAuthMethod(
            selectedAuthType,
            apiKey: apiKey.isEmpty ? nil : apiKey,
            googleCloudProject: googleCloudProject.isEmpty ? nil : googleCloudProject,
            googleCloudLocation: googleCloudLocation.isEmpty ? nil : googleCloudLocation
        )
        
        if let error = error {
            validationError = error
            return false
        }
        
        validationError = nil
        return true
    }
    
    /// 执行认证
    func authenticate() async {
        guard validateInput() else { return }
        
        await authService.authenticate(
            authType: selectedAuthType,
            apiKey: apiKey.isEmpty ? nil : apiKey,
            googleCloudProject: googleCloudProject.isEmpty ? nil : googleCloudProject,
            googleCloudLocation: googleCloudLocation.isEmpty ? nil : googleCloudLocation
        )
    }
    
    /// 关闭认证对话框
    func closeAuthDialog() {
        authService.closeAuthDialog()
    }
    
    // MARK: - Private Methods
    
    /// 验证认证方法（从AuthService拆分出来的验证逻辑）
    private func validateAuthMethod(_ authType: AuthType, apiKey: String? = nil, googleCloudProject: String? = nil, googleCloudLocation: String? = nil) -> String? {
        switch authType {
        case .loginWithGoogle:
            return nil // Google 登录不需要额外验证
            
        case .useGemini:
            if apiKey?.isEmpty != false {
                return String(localized: "请输入 Gemini API Key")
            }
            return nil
            
        case .useVertexAI:
            if apiKey?.isEmpty != false {
                return String(localized: "请输入 Google API Key")
            }
            if googleCloudProject?.isEmpty != false {
                return String(localized: "请输入 Google Cloud Project ID")
            }
            if googleCloudLocation?.isEmpty != false {
                return String(localized: "请输入 Google Cloud Location")
            }
            return nil
        }
    }
}
