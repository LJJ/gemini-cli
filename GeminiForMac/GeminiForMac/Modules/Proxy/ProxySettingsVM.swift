//
//  ProxySettingsVM.swift
//  GeminiForMac
//
//  Created by AI Assistant on 2025/7/15.
//

import Foundation
import SwiftUI

@MainActor
class ProxySettingsVM: ObservableObject {
    private let apiService: APIService
    
    // MARK: - UI State
    @Published var isEnabled = false
    @Published var host = "127.0.0.1"
    @Published var port = "7890"
    @Published var proxyType = "http"
    @Published var showAlert = false
    @Published var alertMessage = ""
    @Published var alertTitle = ""
    
    // MARK: - API State
    @Published var currentConfig: ProxyConfig?
    @Published var isLoading = false
    @Published var lastError: String?
    
    // MARK: - Constants
    let proxyTypes = ["http", "https", "socks"]
    
    init(apiService: APIService = APIService()) {
        self.apiService = apiService
    }
    
    // MARK: - Public Methods
    
    /// 加载代理配置
    func loadConfig() async {
        isLoading = true
        lastError = nil
        
        let baseResponse: BaseResponse<ProxyConfig>? = await apiService.getRequest(path: "/proxy/config")
        if let baseResponse = baseResponse {
            currentConfig = baseResponse.data
            updateUIFromConfig()
        } else {
            lastError = "获取代理配置失败"
        }
        
        isLoading = false
    }
    
    /// 测试代理连接
    func testProxy() async -> Bool {
        isLoading = true
        lastError = nil
        
        let baseResponse: BaseResponse<ProxyTestData>? = await apiService.postRequest(path: "/proxy/test", body: [:])
        if let baseResponse = baseResponse {
            isLoading = false
            return baseResponse.data.working
        } else {
            lastError = "测试代理连接失败"
            isLoading = false
            return false
        }
    }
    
    /// 保存代理配置
    func saveConfig() async -> Bool {
        isLoading = true
        lastError = nil
        
        let success: Bool
        if isEnabled {
            guard let portNumber = Int(port), !host.isEmpty else  {
                showAlert(title: String(localized: "输入错误"), message: String(localized: "请输入有效的主机地址和端口号"))
                isLoading = false
                return false
            }
            success = await setConfig(enabled: true, host: host, port: portNumber, type: proxyType)
        } else {
            success = await setConfig(enabled: false)
        }
        
        if !success {
            showAlert(title: String(localized: "保存失败"), message: lastError ?? String(localized: "未知错误"))
        }
        
        isLoading = false
        return success
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
    
    // MARK: - Private Methods
    
    /// 设置代理配置
    private func setConfig(enabled: Bool, host: String? = nil, port: Int? = nil, type: String = "http") async -> Bool {
        var body: [String: Any] = [
            "enabled": enabled,
            "type": type
        ]
        
        if let host = host, !host.isEmpty {
            body["host"] = host
        }
        
        if let port = port, port > 0 {
            body["port"] = port
        }
        
        let baseResponse: BaseResponse<ProxyConfig>? = await apiService.postRequest(path: "/proxy/config", body: body)
        if let baseResponse = baseResponse {
            currentConfig = baseResponse.data
            return true
        } else {
            lastError = "设置代理配置失败"
            return false
        }
    }
    
    /// 从配置更新UI状态
    private func updateUIFromConfig() {
        if let config = currentConfig {
            isEnabled = config.enabled
            host = config.host ?? "127.0.0.1"
            port = config.port != nil ? String(config.port!) : "7890"
            proxyType = config.type ?? "http"
        }
    }
} 
