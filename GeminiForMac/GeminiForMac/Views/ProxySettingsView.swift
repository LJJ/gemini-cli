//
//  ProxySettingsView.swift
//  GeminiForMac
//
//  Created by AI Assistant on 2025/7/15.
//

import SwiftUI

struct ProxySettingsView: View {
    @StateObject private var proxyService = ProxyService()
    @Environment(\.dismiss) private var dismiss
    
    @State private var isEnabled = false
    @State private var host = "127.0.0.1"
    @State private var port = "7890"
    @State private var proxyType = "http"
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var alertTitle = ""
    
    private let proxyTypes = ["http", "https", "socks"]
    
    var body: some View {
        VStack(spacing: 20) {
            // 标题
            Text("代理设置")
                .font(.title2)
                .fontWeight(.semibold)
                .padding(.top)
            
            // 启用/禁用切换
            VStack(alignment: .leading, spacing: 10) {
                Toggle("启用代理", isOn: $isEnabled)
                    .font(.headline)
                
                if isEnabled {
                    VStack(alignment: .leading, spacing: 12) {
                        // 主机地址
                        VStack(alignment: .leading, spacing: 4) {
                            Text("主机地址")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            TextField("127.0.0.1", text: $host)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        // 端口号
                        VStack(alignment: .leading, spacing: 4) {
                            Text("端口号")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            TextField("7890", text: $port)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        // 代理类型
                        VStack(alignment: .leading, spacing: 4) {
                            Text("代理类型")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            Picker("代理类型", selection: $proxyType) {
                                ForEach(proxyTypes, id: \.self) { type in
                                    Text(type.uppercased()).tag(type)
                                }
                            }
                            .pickerStyle(SegmentedPickerStyle())
                        }
                    }
                    .padding(.leading, 20)
                    .animation(.easeInOut(duration: 0.2), value: isEnabled)
                }
            }
            
            // 当前状态显示
            if let config = proxyService.currentConfig {
                VStack(alignment: .leading, spacing: 8) {
                    Text("当前状态")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Image(systemName: config.enabled ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(config.enabled ? .green : .red)
                        Text(config.enabled ? "已启用" : "已禁用")
                        Spacer()
                        
                        if config.enabled, let host = config.host, let port = config.port {
                            Text("\(host):\(port)")
                                .font(.monospaced(.body)())
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
            }
            
            // 错误信息
            if let error = proxyService.lastError {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
                    .padding(.horizontal)
            }
            
            Spacer()
            
            // 按钮组
            HStack(spacing: 12) {
                // 测试连接按钮
                Button("测试连接") {
                    Task {
                        let success = await proxyService.testProxy()
                        alertTitle = "连接测试"
                        alertMessage = success ? "代理连接正常" : "代理连接失败"
                        showAlert = true
                    }
                }
                .disabled(proxyService.isLoading || !isEnabled)
                
                Spacer()
                
                // 取消按钮
                Button("取消") {
                    dismiss()
                }
                .keyboardShortcut(.escape)
                
                // 保存按钮
                Button("保存") {
                    Task {
                        let success: Bool
                        if isEnabled {
                            guard let portNumber = Int(port), !host.isEmpty else {
                                alertTitle = "输入错误"
                                alertMessage = "请输入有效的主机地址和端口号"
                                showAlert = true
                                return
                            }
                            success = await proxyService.enableProxy(host: host, port: portNumber, type: proxyType)
                        } else {
                            success = await proxyService.disableProxy()
                        }
                        
                        if success {
                            dismiss()
                        } else {
                            alertTitle = "保存失败"
                            alertMessage = proxyService.lastError ?? "未知错误"
                            showAlert = true
                        }
                    }
                }
                .keyboardShortcut(.return)
                .disabled(proxyService.isLoading)
            }
            .padding(.bottom)
        }
        .padding()
        .frame(width: 400, height: 350)
        .onAppear {
            Task {
                await proxyService.loadConfig()
                updateUIFromConfig()
            }
        }
        .alert(alertTitle, isPresented: $showAlert) {
            Button("确定", role: .cancel) { }
        } message: {
            Text(alertMessage)
        }
        .overlay {
            if proxyService.isLoading {
                ProgressView()
                    .scaleEffect(0.8)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black.opacity(0.1))
            }
        }
    }
    
    private func updateUIFromConfig() {
        if let config = proxyService.currentConfig {
            isEnabled = config.enabled
            host = config.host ?? "127.0.0.1"
            port = config.port != nil ? String(config.port!) : "7890"
            proxyType = config.type ?? "http"
        }
    }
}

#Preview {
    ProxySettingsView()
}