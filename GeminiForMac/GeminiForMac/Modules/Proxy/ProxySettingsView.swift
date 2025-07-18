//
//  ProxySettingsView.swift
//  GeminiForMac
//
//  Created by AI Assistant on 2025/7/15.
//

import SwiftUI

struct ProxySettingsView: View {
    @StateObject private var proxyVM = ProxySettingsVM()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: 20) {
            // 标题
            Text("代理设置")
                .font(.title2)
                .fontWeight(.semibold)
                .padding(.top)
            
            // 启用/禁用切换
            VStack(alignment: .leading, spacing: 10) {
                Toggle("启用代理", isOn: $proxyVM.isEnabled)
                    .font(.headline)
                
                if proxyVM.isEnabled {
                    VStack(alignment: .leading, spacing: 12) {
                        // 主机地址
                        VStack(alignment: .leading, spacing: 4) {
                            Text("主机地址")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            TextField("127.0.0.1", text: $proxyVM.host)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        // 端口号
                        VStack(alignment: .leading, spacing: 4) {
                            Text("端口号")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            TextField("7890", text: $proxyVM.port)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        // 代理类型
                        VStack(alignment: .leading, spacing: 4) {
                            Text("代理类型")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            Picker("代理类型", selection: $proxyVM.proxyType) {
                                ForEach(proxyVM.proxyTypes, id: \.self) { type in
                                    Text(type.uppercased()).tag(type)
                                }
                            }
                            .pickerStyle(SegmentedPickerStyle())
                        }
                    }
                    .padding(.leading, 20)
                    .animation(.easeInOut(duration: 0.2), value: proxyVM.isEnabled)
                }
            }
            
            // 当前状态显示
            if let config = proxyVM.currentConfig {
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
            if let error = proxyVM.lastError {
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
                        guard let portNumber = Int(proxyVM.port), !proxyVM.host.isEmpty else {
                            proxyVM.showAlert(
                                title: String(localized: "输入错误"),
                                message: String(localized: "请输入有效的主机地址和端口号")
                            )
                            return
                        }
                        
                        let success = await proxyVM.testProxy(host: proxyVM.host, port: portNumber, type: proxyVM.proxyType)
                        proxyVM.showAlert(
                            title: String(localized: "连接测试"),
                            message: success ? String(localized: "代理连接正常") : String(localized: "代理连接失败")
                        )
                    }
                }
                .disabled(proxyVM.isLoading || !proxyVM.isEnabled)
                
                Spacer()
                
                // 取消按钮
                Button("取消") {
                    dismiss()
                }
                .keyboardShortcut(.escape)
                
                // 保存按钮
                Button("保存") {
                    Task {
                        let success = await proxyVM.saveConfig()
                        if success {
                            dismiss()
                        }
                    }
                }
                .keyboardShortcut(.return)
                .disabled(proxyVM.isLoading)
            }
            .padding(.bottom)
        }
        .padding()
        .frame(width: 400, height: 450)
        .onAppear {
            Task {
                await proxyVM.loadConfig()
            }
        }
        .alert(proxyVM.alertTitle, isPresented: $proxyVM.showAlert) {
            Button("确定", role: .cancel) { }
        } message: {
            Text(proxyVM.alertMessage)
        }
        .overlay {
            if proxyVM.isLoading {
                ProgressView()
                    .scaleEffect(0.8)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black.opacity(0.1))
            }
        }
    }
}

#Preview {
    ProxySettingsView()
}
