# VPS Docker deploy (alternatif)

Azure rehberi: [../docs/FAZ3-CANLI-DEPLOY.md](../docs/FAZ3-CANLI-DEPLOY.md)

```bash
cp .env.production.example .env.production
# düzenle
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
curl http://localhost:8080/health
```

Web build PC’de: `.\scripts\publish-web-production.ps1 -ApiBaseUrl http://SUNUCU_IP:8080`
