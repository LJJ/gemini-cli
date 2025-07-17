/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProxyConfigManager } from './ProxyConfigManager.js';

/**
 * 网络连接检查器
 * 用于检查网络连接，特别是对Google服务的连接
 */
export class NetworkChecker {
  private static instance: NetworkChecker | null = null;
  private proxyManager: ProxyConfigManager;

  private constructor() {
    this.proxyManager = ProxyConfigManager.getInstance();
  }

  public static getInstance(): NetworkChecker {
    if (!NetworkChecker.instance) {
      NetworkChecker.instance = new NetworkChecker();
    }
    return NetworkChecker.instance;
  }

  /**
   * 检查对Google服务的网络连接
   * @returns Promise<boolean> 是否能够连接到Google服务
   */
  public async checkGoogleConnectivity(): Promise<boolean> {
    console.log('NetworkChecker: 开始检查Google服务连接...');

    // 定义要测试的Google服务端点
    const testEndpoints = [
      'https://www.google.com',
      'https://generativelanguage.googleapis.com',
      'https://oauth2.googleapis.com'
    ];

    // 尝试连接到至少一个Google服务
    for (const endpoint of testEndpoints) {
      console.log(`NetworkChecker: 测试连接到 ${endpoint}`);
      
      if (await this.testConnection(endpoint)) {
        console.log(`NetworkChecker: 成功连接到 ${endpoint}`);
        return true;
      }
    }

    console.warn('NetworkChecker: 无法连接到任何Google服务');
    return false;
  }

  /**
   * 测试对特定URL的连接
   * @param url 要测试的URL
   * @param timeout 超时时间（毫秒），默认5秒
   * @returns Promise<boolean> 是否能够连接
   */
  private async testConnection(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD', // 使用HEAD请求减少数据传输
        signal: controller.signal,
        headers: {
          'User-Agent': 'Gemini-CLI-NetworkChecker/1.0'
        }
      });

      clearTimeout(timeoutId);

      // 检查响应状态
      if (response.ok || response.status === 301 || response.status === 302) {
        return true;
      }

      console.warn(`NetworkChecker: ${url} 返回状态码 ${response.status}`);
      return false;

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.warn(`NetworkChecker: 连接 ${url} 超时`);
      } else {
        console.warn(`NetworkChecker: 连接 ${url} 失败:`, (error as Error).message);
      }
      return false;
    }
  }

  /**
   * 获取网络诊断信息
   * @returns 网络诊断结果
   */
  public async getDiagnosticInfo(): Promise<{
    googleConnectivity: boolean;
    proxyEnabled: boolean;
    proxyWorking: boolean;
    suggestions: string[];
  }> {
    console.log('NetworkChecker: 执行网络诊断...');

    const googleConnectivity = await this.checkGoogleConnectivity();
    const proxyConfig = this.proxyManager.getConfig();
    const proxyEnabled = proxyConfig.enabled;
    let proxyWorking = false;

    if (proxyEnabled) {
      proxyWorking = await this.proxyManager.testProxy();
    }

    const suggestions: string[] = [];

    if (!googleConnectivity) {
      if (!proxyEnabled) {
        suggestions.push('无法连接到Google服务，请检查网络连接');
        suggestions.push('如果在防火墙或受限网络环境中，请配置代理服务器');
        suggestions.push('您可以在应用中设置代理：设置 -> 代理配置');
      } else if (!proxyWorking) {
        suggestions.push('代理已启用但无法正常工作，请检查代理设置');
        suggestions.push('确认代理服务器地址和端口正确');
        suggestions.push('检查代理服务器是否支持HTTPS连接');
      } else {
        suggestions.push('代理工作正常但仍无法连接Google服务');
        suggestions.push('可能是代理服务器限制了对Google服务的访问');
        suggestions.push('请联系网络管理员或尝试其他代理服务器');
      }
    }

    return {
      googleConnectivity,
      proxyEnabled,
      proxyWorking,
      suggestions
    };
  }

  /**
   * 生成网络连接错误消息
   * @returns 详细的错误消息
   */
  public async generateConnectivityErrorMessage(): Promise<string> {
    const diagnostic = await this.getDiagnosticInfo();
    
    let message = '无法连接到Google服务，请检查网络设置。\n\n';
    message += '诊断信息：\n';
    message += `- Google服务连接: ${diagnostic.googleConnectivity ? '✅ 正常' : '❌ 失败'}\n`;
    message += `- 代理设置: ${diagnostic.proxyEnabled ? '✅ 已启用' : '❌ 未启用'}\n`;
    
    if (diagnostic.proxyEnabled) {
      message += `- 代理连接: ${diagnostic.proxyWorking ? '✅ 正常' : '❌ 失败'}\n`;
    }
    
    if (diagnostic.suggestions.length > 0) {
      message += '\n建议解决方案：\n';
      diagnostic.suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n`;
      });
    }

    return message;
  }
} 