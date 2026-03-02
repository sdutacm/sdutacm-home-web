FROM algoux/nodebase:16

WORKDIR /app/

COPY . .
RUN npm install -g pnpm@8
RUN pnpm i --frozen-lockfile && npm run build

ENV PATH="/app/node_modules/pm2/bin:${PATH}"
CMD npm run deploy:foreground
