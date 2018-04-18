#!/bin/bash

#Sailer bash installer for ubuntu/debian
spinner()
{
    local pid=$!
    local delay=0.25
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

echo -ne "Installing curl, nginx & git..."
apt-get update -qq >/dev/null 2>&1 & spinner
apt-get install -yqq curl nginx git >/dev/null 2>&1 & spinner
printf "DONE\n"
echo -ne "Installing nodejs..."
curl -fsL https://deb.nodesource.com/setup_9.x | bash >/dev/null 2>&1 &spinner
apt-get install -yqq nodejs >/dev/null 2>&1 & spinner
printf "DONE\n"
echo -ne "Installing Docker..."
curl -fsL -o docker.sh https://get.docker.com & spinner
bash docker.sh >/dev/null 2>&1 & spinner
printf "DONE\n"
echo -ne "Installing Sailer..."
npm i -g sailer-cli >/dev/null 2>&1 & spinner
mkdir /var/log/sailer
echo "{}" > ~/.sailer
chmod 0600 ~/.sailer
printf "DONE\n"
echo -ne "Configuring Nginx..."
curl -fsL -o /etc/nginx/conf.d/proxy.conf https://cdn.sailer.io/nginx-proxy.conf & spinner
service nginx restart & spinner
printf "DONE\n"
echo "Installation successfull. Sailer node is ready."