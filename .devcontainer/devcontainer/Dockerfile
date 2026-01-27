FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

COPY ./profile.d /etc/profile.d
COPY ./.config /root/.config
COPY ./.npmrc /root/.npmrc


ENV PATH="/root/.local/bin:${PATH}"
ENV PATH="/root/.local/share/mise/shims:$PATH"
ENV MISE_ENV=dev
