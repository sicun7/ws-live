1.  准备云服务器环境
    购买云服务器(如阿里云、腾讯云等)
    配置安全组，开放必要的端口：
    前端应用端口(如 80/443)
    WebSocket 端口
    WebRTC 信令服务器端口
    TURN/STUN 服务器端口(用于 NAT 穿透)

2.  配置 HTTPS
    由于 WebRTC 要求在生产环境使用 HTTPS，需要：
    购买域名并解析到服务器
    申请 SSL 证书
    配置 Nginx 反向代理

3.  修改客户端配置
    需要更新环境变量文件：
4.  部署 TURN 服务器
    由于公网环境下 NAT 穿透可能失败，建议：
    部署 TURN 服务器(如 coturn)
    修改 WebRTC 配置：

5.  服务端部署
    安装 Node.js 环境
    使用 PM2 等进程管理工具运行服务端
    配置环境变量：

6.  前端部署
    构建前端项目：npm run build
    配置 Nginx 服务器：
    server {
    listen 443 ssl;
    server_name your-domain.com;

        ssl_certificate /path/to/cert.pem;
        ssl_certificate_key /path/to/key.pem;

        # 前端静态文件
        location / {
            root /path/to/client/dist;
            try_files $uri $uri/ /index.html;
        }

        # WebSocket代理
        location /socket.io/ {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # API代理
        location /api/ {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

    }

7.其他注意事项
确保服务器防火墙配置正确
监控服务器资源使用情况
考虑使用 CDN 加速静态资源
实现错误监控和日志系统
考虑使用负载均衡器处理大量并发连接
