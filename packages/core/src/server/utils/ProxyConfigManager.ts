/**
 * 代理配置管理器
 * 负责代理配置的持久化存储和读取
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
// import { HttpsProxyAgent } from 'https-proxy-agent';
// import { SocksProxyAgent } from 'socks-proxy-agent';

export interface ProxyConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  type?: 'http' | 'https' | 'socks' | 'socks5';
  lastUpdated: number;
}

export class ProxyConfigManager {
  private static instance: ProxyConfigManager;
  private configPath: string;
  private currentConfig: ProxyConfig;

  private constructor() {
    this.configPath = join(homedir(), '.gemini-server', 'proxy-config.json');
    console.log(`ProxyConfigManager: 初始化，配置文件路径: ${this.configPath}`);
    this.currentConfig = this.loadConfig();
    this.applyProxyConfig();
  }

  public static getInstance(): ProxyConfigManager {
    if (!ProxyConfigManager.instance) {
      console.log('ProxyConfigManager: 创建单例实例');
      ProxyConfigManager.instance = new ProxyConfigManager();
    }
    return ProxyConfigManager.instance;
  }

  /**
   * 从配置文件加载代理配置
   */
  private loadConfig(): ProxyConfig {
    console.log(`ProxyConfigManager: 开始加载配置文件: ${this.configPath}`);
    try {
      if (existsSync(this.configPath)) {
        console.log('ProxyConfigManager: 配置文件存在，正在读取...');
        const content = readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(content);
        console.log('ProxyConfigManager: 配置文件加载成功:', JSON.stringify(config, null, 2));
        return config;
      } else {
        console.log('ProxyConfigManager: 配置文件不存在，使用默认配置');
      }
    } catch (error) {
      console.warn('ProxyConfigManager: 读取配置文件失败:', error);
    }

    // 默认配置
    const defaultConfig = {
      enabled: false,
      lastUpdated: Date.now()
    };
    console.log('ProxyConfigManager: 使用默认配置:', JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  /**
   * 保存配置到文件
   */
  private saveConfig(): void {
    console.log('ProxyConfigManager: 开始保存配置到文件');
    try {
      // 确保目录存在
      const dir = dirname(this.configPath);
      if (!existsSync(dir)) {
        console.log(`ProxyConfigManager: 创建配置目录: ${dir}`);
        mkdirSync(dir, { recursive: true });
      }

      this.currentConfig.lastUpdated = Date.now();
      const configContent = JSON.stringify(this.currentConfig, null, 2);
      writeFileSync(this.configPath, configContent);
      console.log('ProxyConfigManager: 配置已保存到文件');
      console.log('ProxyConfigManager: 保存的配置内容:', configContent);
    } catch (error) {
      console.error('ProxyConfigManager: 保存配置文件失败:', error);
    }
  }

  /**
   * 应用代理配置到进程环境变量
   */
  private applyProxyConfig(): void {
    console.log('ProxyConfigManager: 开始应用代理配置到环境变量');
    console.log('ProxyConfigManager: 当前配置:', JSON.stringify(this.currentConfig, null, 2));
    
    if (this.currentConfig.enabled && this.currentConfig.host && this.currentConfig.port) {
      const proxyUrl = `http://${this.currentConfig.host}:${this.currentConfig.port}`;
      console.log(`ProxyConfigManager: 设置代理环境变量: ${proxyUrl}`);
      
      // 记录设置前的环境变量状态
      console.log('ProxyConfigManager: 设置前的环境变量状态:');
      console.log('  http_proxy:', process.env['http_proxy']);
      console.log('  https_proxy:', process.env['https_proxy']);
      console.log('  HTTP_PROXY:', process.env['HTTP_PROXY']);
      console.log('  HTTPS_PROXY:', process.env['HTTPS_PROXY']);
      
      process.env['http_proxy'] = proxyUrl;
      process.env['https_proxy'] = proxyUrl;
      process.env['HTTP_PROXY'] = proxyUrl;
      process.env['HTTPS_PROXY'] = proxyUrl;
      
      // 记录设置后的环境变量状态
      console.log('ProxyConfigManager: 设置后的环境变量状态:');
      console.log('  http_proxy:', process.env['http_proxy']);
      console.log('  https_proxy:', process.env['https_proxy']);
      console.log('  HTTP_PROXY:', process.env['HTTP_PROXY']);
      console.log('  HTTPS_PROXY:', process.env['HTTPS_PROXY']);
      
      console.log(`ProxyConfigManager: 代理已启用 ${proxyUrl}`);
    } else {
      console.log('ProxyConfigManager: 禁用代理环境变量');
      
      // 记录删除前的环境变量状态
      console.log('ProxyConfigManager: 删除前的环境变量状态:');
      console.log('  http_proxy:', process.env['http_proxy']);
      console.log('  https_proxy:', process.env['https_proxy']);
      console.log('  HTTP_PROXY:', process.env['HTTP_PROXY']);
      console.log('  HTTPS_PROXY:', process.env['HTTPS_PROXY']);
      
      delete process.env['http_proxy'];
      delete process.env['https_proxy'];
      delete process.env['HTTP_PROXY'];
      delete process.env['HTTPS_PROXY'];
      
      // 记录删除后的环境变量状态
      console.log('ProxyConfigManager: 删除后的环境变量状态:');
      console.log('  http_proxy:', process.env['http_proxy']);
      console.log('  https_proxy:', process.env['https_proxy']);
      console.log('  HTTP_PROXY:', process.env['HTTP_PROXY']);
      console.log('  HTTPS_PROXY:', process.env['HTTPS_PROXY']);
      
      console.log('ProxyConfigManager: 代理已禁用');
    }
  }

  /**
   * 获取当前代理配置
   */
  public getConfig(): ProxyConfig {
    console.log('ProxyConfigManager: 获取当前配置');
    const config = { ...this.currentConfig };
    console.log('ProxyConfigManager: 返回配置:', JSON.stringify(config, null, 2));
    return config;
  }

  /**
   * 更新代理配置
   */
  public updateConfig(config: Partial<ProxyConfig>): void {
    console.log('ProxyConfigManager: 开始更新配置');
    console.log('ProxyConfigManager: 更新参数:', JSON.stringify(config, null, 2));
    console.log('ProxyConfigManager: 更新前配置:', JSON.stringify(this.currentConfig, null, 2));
    
    this.currentConfig = {
      ...this.currentConfig,
      ...config
    };
    
    console.log('ProxyConfigManager: 更新后配置:', JSON.stringify(this.currentConfig, null, 2));
    this.saveConfig();
    this.applyProxyConfig();
  }

  /**
   * 设置代理
   */
  public setProxy(host: string, port: number, type: 'http' | 'https' | 'socks' | 'socks5' = 'http'): void {
    console.log(`ProxyConfigManager: 设置代理 - host: ${host}, port: ${port}, type: ${type}`);
    this.updateConfig({
      enabled: true,
      host,
      port,
      type
    });
  }

  /**
   * 禁用代理
   */
  public disableProxy(): void {
    console.log('ProxyConfigManager: 禁用代理');
    this.updateConfig({
      enabled: false
    });
  }

  /**
   * 启用代理
   */
  public enableProxy(): void {
    console.log('ProxyConfigManager: 尝试启用代理');
    if (this.currentConfig.host && this.currentConfig.port) {
      console.log(`ProxyConfigManager: 代理配置存在，启用代理 - host: ${this.currentConfig.host}, port: ${this.currentConfig.port}`);
      this.updateConfig({
        enabled: true
      });
    } else {
      console.log('ProxyConfigManager: 代理配置不完整，无法启用代理');
      console.log('ProxyConfigManager: 当前配置:', JSON.stringify(this.currentConfig, null, 2));
    }
  }

  /**
   * 获取代理状态信息
   */
  public getProxyInfo(): {
    enabled: boolean;
    url: string | null;
    config: ProxyConfig;
  } {
    console.log('ProxyConfigManager: 获取代理状态信息');
    const config = this.getConfig();
    let url = null;
    
    if (config.enabled && config.host && config.port) {
      url = `${config.type || 'http'}://${config.host}:${config.port}`;
      console.log(`ProxyConfigManager: 代理URL: ${url}`);
    } else {
      console.log('ProxyConfigManager: 代理未配置或未启用');
    }

    const info = {
      enabled: config.enabled,
      url,
      config
    };
    console.log('ProxyConfigManager: 代理状态信息:', JSON.stringify(info, null, 2));
    return info;
  }

  /**
   * 测试代理服务器连接
   * 只检查本地代理服务器是否可达，不测试外部网站连接
   * @param testConfig 可选的临时代理配置，如果提供则测试此配置而不保存
   */
  public async testProxy(testConfig?: Partial<ProxyConfig>): Promise<boolean> {
    console.log('ProxyConfigManager: 开始测试代理服务器连接');
    
    // 如果提供了测试配置，使用测试配置；否则使用当前保存的配置
    const config = testConfig ? { ...this.getConfig(), ...testConfig } : this.getConfig();
    console.log('ProxyConfigManager: 测试配置:', JSON.stringify(config, null, 2));
    
    if (testConfig) {
      console.log('ProxyConfigManager: 使用临时配置进行测试（不会保存）');
    } else {
      console.log('ProxyConfigManager: 使用当前保存的配置进行测试');
    }
    
    if (!config.enabled || !config.host || !config.port) {
      console.log('ProxyConfigManager: 代理未启用或配置不完整，跳过测试');
      return false;
    }

    try {
      console.log(`ProxyConfigManager: 测试代理服务器 ${config.host}:${config.port} 连通性`);
      
      // 使用 Node.js 原生的 net 模块测试 TCP 连接
      const net = await import('net');
      
      return new Promise((resolve) => {
        const socket = new net.Socket();
        
        // 设置连接超时
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
          console.log('ProxyConfigManager: ✅ 代理服务器连接成功');
          socket.destroy();
          resolve(true);
        });
        
        socket.on('error', (error) => {
          console.log(`ProxyConfigManager: ❌ 代理服务器连接失败: ${error.message}`);
          socket.destroy();
          resolve(false);
        });
        
        socket.on('timeout', () => {
          console.log('ProxyConfigManager: ❌ 代理服务器连接超时');
          socket.destroy();
          resolve(false);
        });
        
        // 尝试连接到代理服务器
        socket.connect(config.port!, config.host!);
      });
      
    } catch (error) {
      console.error('ProxyConfigManager: 代理测试异常:', error instanceof Error ? error.message : '未知错误');
      return false;
    }
  }
}