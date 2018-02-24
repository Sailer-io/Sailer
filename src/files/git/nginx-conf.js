module.exports = `server {
        listen   80;
        server_name  %s;
        access_log  /var/log/sailer/%s.access.log;
        error_log  /var/log/sailer/%s.error.log debug;
        location / {
                proxy_pass         http://127.0.0.1:%s/;
        }
}`