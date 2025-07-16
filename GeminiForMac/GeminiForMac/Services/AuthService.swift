//
//  AuthService.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/9.
//

import Foundation
import SwiftUI

@MainActor
class AuthService: ObservableObject {
    @Published var authStatus: AuthStatus = .notAuthenticated
    @Published var currentAuthType: AuthType?
    @Published var showAuthDialog = false
    @Published var errorMessage: String?
    
    private let userDefaults = UserDefaults.standard
    private let authConfigKey = "GeminiForMac_AuthConfig"
    
    init() {
        loadSavedAuthConfig()
    }
    
    // MARK: - 认证配置管理
    
    private func loadSavedAuthConfig() {
        if let data = userDefaults.data(forKey: authConfigKey),
           let config = try? JSONDecoder().decode(AuthConfig.self, from: data) {
            currentAuthType = config.authType
            authStatus = .authenticated
        } else {
            // 没有保存的认证配置，显示认证对话框
            showAuthDialog = true
        }
    }
    
    private func saveAuthConfig(_ config: AuthConfig) {
        if let data = try? JSONEncoder().encode(config) {
            userDefaults.set(data, forKey: authConfigKey)
        }
    }
    
    func clearAuthConfig() {
        Task {
            // 调用后端API清除认证配置
            let _ = await APIService().clearAuth()
            
            // 清除本地存储
            userDefaults.removeObject(forKey: authConfigKey)
            currentAuthType = nil
            authStatus = .notAuthenticated
            showAuthDialog = true
        }
    }
    
    func logout() {
        Task {
            // 调用后端API登出
            let _ = await APIService().logout()
            
            // 清除本地存储
            userDefaults.removeObject(forKey: authConfigKey)
            currentAuthType = nil
            authStatus = .notAuthenticated
            showAuthDialog = true
        }
    }
    
    // MARK: - 认证验证
    
    func validateAuthMethod(_ authType: AuthType, apiKey: String? = nil, googleCloudProject: String? = nil, googleCloudLocation: String? = nil) -> String? {
        switch authType {
        case .loginWithGoogle:
            return nil // Google 登录不需要额外验证
            
        case .useGemini:
            if apiKey?.isEmpty != false {
                return "请输入 Gemini API Key"
            }
            return nil
            
        case .useVertexAI:
            if apiKey?.isEmpty != false {
                return "请输入 Google API Key"
            }
            if googleCloudProject?.isEmpty != false {
                return "请输入 Google Cloud Project ID"
            }
            if googleCloudLocation?.isEmpty != false {
                return "请输入 Google Cloud Location"
            }
            return nil
        }
    }
    
    // MARK: - 认证处理
    
    func authenticate(authType: AuthType, apiKey: String? = nil, googleCloudProject: String? = nil, googleCloudLocation: String? = nil) async {
        // 验证认证方法
        if let error = validateAuthMethod(authType, apiKey: apiKey, googleCloudProject: googleCloudProject, googleCloudLocation: googleCloudLocation) {
            authStatus = .error(error)
            errorMessage = error
            return
        }
        
        authStatus = .authenticating
        errorMessage = nil
        
        do {
            // 创建认证配置
            let config = AuthConfig(
                authType: authType,
                apiKey: apiKey,
                googleCloudProject: googleCloudProject,
                googleCloudLocation: googleCloudLocation
            )
            
            // 保存认证配置
            saveAuthConfig(config)
            currentAuthType = authType
            
            // 与服务器端通信
            let apiService = APIService()
            
            // 设置认证配置
            if let response = await apiService.setAuthConfig(
                authType: authType,
                apiKey: apiKey,
                googleCloudProject: googleCloudProject,
                googleCloudLocation: googleCloudLocation
            ) {
                // 认证配置成功（服务器返回了响应就表示成功）
                // 根据认证类型处理
                switch authType {
                case .loginWithGoogle:
                    // Google 登录需要服务器端处理
                    await handleGoogleCodeLogin()
                    
                case .useGemini, .useVertexAI:
                    // API Key 认证直接完成
                    authStatus = .authenticated
                    showAuthDialog = false
                }
            } else {
                authStatus = .error("无法连接到服务器")
                errorMessage = "无法连接到服务器"
            }
            
        } catch {
            authStatus = .error(error.localizedDescription)
            errorMessage = error.localizedDescription
        }
    }
    
    private func handleGoogleCodeLogin() async {
        print("开始处理 Google Code 登录...")
        
        // 第一步：获取授权 URL
        authStatus = .authenticating
        
        let apiService = APIService()
        
        guard let urlResponse = await apiService.getGoogleAuthUrl() else {
            print("获取 Google 授权 URL 失败")
            authStatus = .error("获取授权 URL 失败，请检查网络连接")
            errorMessage = "获取授权 URL 失败，请检查网络连接"
            return
        }
        
        print("收到 Google 授权 URL: \(urlResponse.authUrl)")
        
        // 第二步：在浏览器中打开授权 URL
        guard let url = URL(string: urlResponse.authUrl) else {
            authStatus = .error("无效的授权 URL")
            errorMessage = "无效的授权 URL"
            return
        }
        
        // 打开浏览器
        await MainActor.run {
            NSWorkspace.shared.open(url)
        }
        
        // 第三步：提示用户输入授权码
        await MainActor.run {
            self.showCodeInputDialog()
        }
    }
    
    private func showCodeInputDialog() {
        // 显示授权码输入对话框
        let alert = NSAlert()
        alert.messageText = "Google 授权"
        alert.informativeText = "请在浏览器中完成授权，然后将获得的授权码粘贴到下方："
        alert.addButton(withTitle: "确定")
        alert.addButton(withTitle: "取消")
        
        let inputTextField = NSTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24))
        inputTextField.placeholderString = "请输入授权码"
        alert.accessoryView = inputTextField
        
        let response = alert.runModal()
        
        if response == .alertFirstButtonReturn {
            let code = inputTextField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
            if !code.isEmpty {
                Task {
                    await self.submitGoogleAuthCode(code: code)
                }
            } else {
                authStatus = .error("授权码不能为空")
                errorMessage = "授权码不能为空"
            }
        } else {
            // 用户取消了授权
            authStatus = .notAuthenticated
            errorMessage = nil
        }
    }
    
    private func submitGoogleAuthCode(code: String) async {
        print("提交 Google 授权码...")
        
        let apiService = APIService()
        
        if let response = await apiService.submitGoogleAuthCode(code: code) {
            print("收到 Google 授权码响应: message=\(response.message)")
            
            // Google 登录成功
            print("Google 登录成功，更新认证状态")
            authStatus = .authenticated
            showAuthDialog = false
            errorMessage = nil
        } else {
            print("Google 授权码提交失败")
            authStatus = .error("授权码验证失败，请检查授权码是否正确")
            errorMessage = "授权码验证失败，请检查授权码是否正确"
        }
    }
    
    // MARK: - 公共方法
    
    func openAuthDialog() {
        showAuthDialog = true
    }
    
    func closeAuthDialog() {
        showAuthDialog = false
    }
    
    func isAuthenticated() -> Bool {
        if case .authenticated = authStatus {
            return true
        }
        return false
    }
} 
