# syntax=docker/dockerfile:1.7
FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm

ENV BUN_INSTALL=/usr/local/bun
ENV PATH=${BUN_INSTALL}/bin:${PATH}

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://bun.sh/install | bash \
    && ln -sf "${BUN_INSTALL}/bin/bun" /usr/local/bin/bun \
    && ln -sf "${BUN_INSTALL}/bin/bunx" /usr/local/bin/bunx

WORKDIR /workspaces/VRCI-Dashboard

USER node
