//
//  ProjectConfigurationVM.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/16.
//

import Foundation
import SwiftUI
import Factory

@MainActor
class ProjectConfigurationVM: ObservableObject {
    // MARK: - UI State
    @Published var projectId = ""
    @Published var isApplying = false
    @Published var showAlert = false
    @Published var alertMessage = ""
    @Published var alertTitle = ""
    @Published var showInstructions = false
    
    // MARK: - API State
    @Published var currentConfig: ProjectIDConfig?
    @Published var isLoading = false
    @Published var lastError: String?
    
    // MARK: - Services
    @Injected(\.chatService) private var chatService
    private let apiService = APIService()
    
    // MARK: - Public Methods
    
    /// 加载项目ID配置
    func loadConfig() async {
        isLoading = true
        lastError = nil
        
        let baseResponse: BaseResponse<ProjectIDConfig>? = await apiService.getRequest(path: "/project/config")
        if let baseResponse = baseResponse {
            currentConfig = baseResponse.data
            updateUIFromConfig()
        } else {
            lastError = "获取项目配置失败"
        }
        
        isLoading = false
    }
    
    /// 应用项目配置
    func applyProjectConfiguration() async -> Bool {
        isApplying = true
        lastError = nil
        
        let trimmedProjectId = projectId.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard !trimmedProjectId.isEmpty else {
            showAlert(title: String(localized: "输入错误"), message: String(localized: "请输入有效的项目ID"))
            isApplying = false
            return false
        }
        
        // 1. 向服务器发送项目ID配置
        let success = await setProjectIdConfig(projectId: trimmedProjectId)
        
        if success {
            // 2. 重新发起chat初始化流程
            await reinitializeChatFlow()
            
            showAlert(title: String(localized: "设置成功"), message: String(format: String(localized: "Google Cloud Project ID 已成功设置为 %@"), trimmedProjectId))
            isApplying = false
            return true
        } else {
            showAlert(title: String(localized: "设置失败"), message: lastError ?? String(localized: "设置项目ID失败"))
            isApplying = false
            return false
        }
    }
    
    /// 显示警告对话框
    func showAlert(title: String, message: String) {
        alertTitle = title
        alertMessage = message
        showAlert = true
    }
    
    /// 清除错误信息
    func clearError() {
        lastError = nil
    }
    
    /// 提取帮助链接
    func extractHelpURL(from message: String) -> String? {
        let pattern = "https://[^\\s]+"
        let regex = try? NSRegularExpression(pattern: pattern, options: [])
        let range = NSRange(location: 0, length: message.utf16.count)
        
        if let match = regex?.firstMatch(in: message, options: [], range: range) {
            return String(message[Range(match.range, in: message)!])
        }
        
        return nil
    }
    
    /// 打开系统设置
    func openSystemPreferences() {
        let script = """
        tell application "System Preferences"
            activate
            reveal pane "com.apple.preference.security"
        end tell
        """
        
        let appleScript = NSAppleScript(source: script)
        appleScript?.executeAndReturnError(nil)
    }
    
    // MARK: - Private Methods
    
    /// 设置项目ID配置
    private func setProjectIdConfig(projectId: String) async -> Bool {
        let request = ProjectIDConfigRequest(projectId: projectId)
        
        let body: [String: Any] = [
            "projectId": projectId
        ]
        
        let baseResponse: BaseResponse<ProjectIDConfigResponse>? = await apiService.postRequest(
            path: "/project/config",
            body: body
        )
        
        if let baseResponse = baseResponse {
            if baseResponse.data.success {
                // 更新本地配置
                currentConfig = ProjectIDConfig(
                    projectId: projectId,
                    lastUpdated: Date().timeIntervalSince1970,
                    isConfigured: true
                )
                return true
            } else {
                lastError = baseResponse.data.message ?? "设置项目ID失败"
                return false
            }
        } else {
            lastError = "与服务器通信失败"
            return false
        }
    }
    
    /// 重新初始化聊天流程
    private func reinitializeChatFlow() async {
        // 清空当前错误状态
        await MainActor.run {
            chatService.errorMessage = nil
            chatService.showProjectConfiguration = false
        }
        
        // 发送一个测试消息来触发重新初始化
        await chatService.sendMessage("系统测试：重新初始化完成")
    }
    
    /// 从配置更新UI状态
    private func updateUIFromConfig() {
        if let config = currentConfig {
            projectId = config.projectId ?? ""
        }
    }
}
