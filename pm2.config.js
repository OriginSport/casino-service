module.exports = {
    apps : [{
        script: './bin/www',
        exec_mode: 'cluster',
        max_memory_restart: '512M',
        max_restarts: 3,
        restart_delay: 3000,
        min_uptime: 3000,
        env_dev: {
            name: 'dev-casino',
            NODE_ENV: 'dev',
            PORT: 8092,
            error_file: '/home/ors/pm2/log/dev-casino-error.log',
            out_file: '/home/ors/pm2/log/dev-casino.log',
            instances: 1,
        },
        env_pro: {
            name: 'pro-casino',
            NODE_ENV: 'pro',
            PORT: 8091,
            error_file: '/home/ors/pm2/log/pro-casino-error.log',
            out_file: '/home/ors/pm2/log/pro-casino.log',
            instances: 1,
        }
    },
    {
        script: './listenEvents.js',
        exec_mode: 'cluster',
        max_memory_restart: '512M',
        max_restarts: 3,
        restart_delay: 500,
        min_uptime: 3000,
        env_dev: {
            name: 'dev-ws-casino',
            NODE_ENV: 'dev',
            PORT: 8192,
            instances: 1,
        },
        env_pro: {
            name: 'pro-ws-casino',
            NODE_ENV: 'pro',
            PORT: 8191,
            instances: 1,
        },
    }]
};
