/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProxyConfigManager } from './ProxyConfigManager.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

/**
 * 网络连接检查器
 * 用于检查网络连接，特别是对Google服务的连接
 */
export class NetworkChecker {
  private static instance: NetworkChecker | null = null;
  private proxyManager: ProxyConfigManager;
  
  // 记录上次检查结果，如果是true就直接跳过
  private static lastCheckResult: boolean | null = null;

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
   * 检查网络连接性
   * @returns Promise<boolean> 是否能够连接到互联网
   */
  public async checkGoogleConnectivity(): Promise<boolean> {
    // 如果上次检查结果是true，直接跳过
    if (NetworkChecker.lastCheckResult === true) {
      console.log('NetworkChecker: 上次检查网络正常，跳过检查');
      return true;
    }

    console.log('NetworkChecker: 开始检查网络连接...');

    // 定义要测试的网络连接端点
    // 使用可靠且可访问的测试端点来验证网络连接
    const testEndpoints = [
      'https://www.gstatic.com/generate_204', // Google 官方网络测试端点，返回 204
      'https://httpbin.org/ip',
      'https://www.baidu.com'
    ];

    // 尝试连接到至少一个服务
    for (const endpoint of testEndpoints) {
      console.log(`NetworkChecker: 测试连接到 ${endpoint}`);
      
      if (await this.testConnection(endpoint)) {
        console.log(`NetworkChecker: 成功连接到 ${endpoint}`);
        NetworkChecker.lastCheckResult = true;
        return true;
      }
    }

    console.warn('NetworkChecker: 无法连接到任何测试服务，可能需要配置代理');
    NetworkChecker.lastCheckResult = false;
    return false;
  }

  /**
   * 测试对特定URL的连接
   * @param url 要测试的URL
   * @param timeout 超时时间（毫秒），默认10秒
   * @returns Promise<boolean> 是否能够连接
   */
  private async testConnection(url: string, timeout: number = 10000): Promise<boolean> {
    try {
      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // 获取代理配置
      const proxyConfig = this.proxyManager.getConfig();
      
      const fetchOptions: any = {
        method: 'HEAD', // 使用HEAD请求减少数据传输
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };

      // 如果代理已启用，根据代理类型选择相应的 agent
      if (proxyConfig.enabled && proxyConfig.host && proxyConfig.port) {
        console.log(`NetworkChecker: 通过代理 ${proxyConfig.host}:${proxyConfig.port} 测试连接 ${url}`);
        console.log(`NetworkChecker: 代理类型: ${proxyConfig.type || 'http'}`);
        
        if (proxyConfig.type === 'socks' || proxyConfig.type === 'socks5') {
          // 使用 SOCKS5 代理
          const proxyUrl = `socks5://${proxyConfig.host}:${proxyConfig.port}`;
          console.log(`NetworkChecker: SOCKS5 代理URL: ${proxyUrl}`);
          const agent = new SocksProxyAgent(proxyUrl);
          fetchOptions.agent = agent;
        } else {
          // 使用 HTTP/HTTPS 代理
          const proxyUrl = `${proxyConfig.type || 'http'}://${proxyConfig.host}:${proxyConfig.port}`;
          console.log(`NetworkChecker: HTTP/HTTPS 代理URL: ${proxyUrl}`);
          const agent = new HttpsProxyAgent(proxyUrl);
          fetchOptions.agent = agent;
        }
      } else {
        console.log(`NetworkChecker: 直接连接测试 ${url}`);
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      // 检查响应状态
      if (response.ok || response.status === 204 || response.status === 301 || response.status === 302) {
        console.log(`NetworkChecker: 成功连接到 ${url}，状态码: ${response.status}`);
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