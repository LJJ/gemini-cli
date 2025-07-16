//
//  GeminiForMacApp.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/4.
//

import SwiftUI
import Factory

@main
struct GeminiForMacApp: App {
    // 确保 ServiceManager 在应用启动时被初始化
    @Injected(\.serverManager) var serverManager
    
    var body: some Scene {
        WindowGroup {
            MainView()
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .commands {
            // 添加自定义菜单
            CommandGroup(after: .appInfo) {
                Divider()
                
                Button("代理设置...") {
                    ProxySettingsManager.shared.openProxySettings()
                }
                .keyboardShortcut("p", modifiers: [.command, .shift])
                
                Divider()
                
                Button("切换认证方式") {
                    // 使用依赖注入获取 AuthService 并清除认证配置
                    let authService = Container.shared.authService.resolve()
                    authService.clearAuthConfig()
                }
                .keyboardShortcut("l", modifiers: [.command, .shift])
                
                Button("登出") {
                    // 使用依赖注入获取 AuthService 并登出
                    let authService = Container.shared.authService.resolve()
                    authService.logout()
                }
                .keyboardShortcut("o", modifiers: [.command, .shift])
            }
        }
    }
}
