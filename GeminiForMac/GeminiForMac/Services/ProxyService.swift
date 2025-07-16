//
//  ProxyService.swift
//  GeminiForMac
//
//  Created by AI Assistant on 2025/7/15.
//

import Foundation
import Combine

@MainActor
class ProxyService: ObservableObject {
    private let apiService: APIService
    
    @Published var currentConfig: ProxyConfig?
    @Published var isLoading = false
    @Published var lastError: String?
    
    init(apiService: APIService = APIService()) {
        self.apiService = apiService
    }
    
    // MARK: - 获取代理配置
    func loadConfig() async {
        isLoading = true
        lastError = nil
        
        let baseResponse: BaseResponse<ProxyConfig>? = await apiService.getRequest(path: "/proxy/config")
        if let baseResponse = baseResponse {
            currentConfig = baseResponse.data
        } else {
            lastError = "获取代理配置失败"
        }
        
        isLoading = false
    }
    
    // MARK: - 设置代理配置
    func setConfig(enabled: Bool, host: String? = nil, port: Int? = nil, type: String = "http") async -> Bool {
        isLoading = true
        lastError = nil
        
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
            isLoading = false
            return true
        } else {
            lastError = "设置代理配置失败"
            isLoading = false
            return false
        }
    }
    
    // MARK: - 测试代理连接
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
    
    // MARK: - 禁用代理
    func disableProxy() async -> Bool {
        return await setConfig(enabled: false)
    }
    
    // MARK: - 启用代理
    func enableProxy(host: String, port: Int, type: String = "http") async -> Bool {
        return await setConfig(enabled: true, host: host, port: port, type: type)
    }
}