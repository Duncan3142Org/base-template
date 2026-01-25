FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# COPY ./profile.d /etc/profile.d
COPY ./.config /root/.config
COPY ./.terraformrc /root/.terraformrc

# Install pass and gnupg for secure credential storage
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends pass gnupg2

ENV PATH="/root/.local/bin:${PATH}"
ENV PATH="/root/.local/share/mise/shims:$PATH"
ENV MISE_ENV=dev
