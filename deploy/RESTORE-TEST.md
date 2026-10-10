# Manuel restore testi (izole ortam)

Amaç: Prod container'a dokunmadan, alınan bir `.bak` yedeğinin gerçekten geri yüklenebildiğini doğrulamak. Haftada bir, elle çalıştırılır — otomatik değildir.

1. Yedeği indir (geçici bir dizine):
   ```bash
   export RCLONE_CONFIG=/etc/ruswallet/rclone.conf
   rclone copy "b2crypt:ruswallet-backups/RusWalletDb_<TARIH>.bak" ./restore-test/
   ```

2. Prod'dan tamamen ayrı, geçici bir SQL Server container başlat (farklı port, farklı ağ):
   ```bash
   docker run -d --name ruswallet-restore-test --rm \
     -e ACCEPT_EULA=Y -e MSSQL_PID=Express \
     -e MSSQL_SA_PASSWORD='<SadeceTestIcinGecici_Sifre!>' \
     -p 127.0.0.1:15330:1433 \
     -v "$(pwd)/restore-test:/var/opt/mssql/restore" \
     mcr.microsoft.com/mssql/server:2022-latest
   ```

3. Geri yükle:
   ```bash
   docker exec -it ruswallet-restore-test /opt/mssql-tools18/bin/sqlcmd -C \
     -S localhost -U sa -P '<SadeceTestIcinGecici_Sifre!>' \
     -Q "RESTORE DATABASE RusWalletDbTest FROM DISK='/var/opt/mssql/restore/RusWalletDb_<TARIH>.bak' WITH MOVE 'RusWalletDb' TO '/var/opt/mssql/data/RusWalletDbTest.mdf', MOVE 'RusWalletDb_log' TO '/var/opt/mssql/data/RusWalletDbTest_log.ldf';"
   ```

4. Doğrula (örnek: kullanıcı tablosu satır sayısı > 0):
   ```bash
   docker exec -it ruswallet-restore-test /opt/mssql-tools18/bin/sqlcmd -C \
     -S localhost -U sa -P '<SadeceTestIcinGecici_Sifre!>' -d RusWalletDbTest \
     -Q "SELECT COUNT(*) FROM Users;"
   ```

5. Temizlik — test container'ı ve indirilen dosyayı sil:
   ```bash
   docker stop ruswallet-restore-test
   rm -rf ./restore-test
   ```

Notlar:
- Test container'ı prod ağına bağlanmaz, prod volume'una yazmaz.
- Gerçek kullanıcı verisi içerdiği için `restore-test/` dizini test sonrası mutlaka silinmeli.
- İleride otomatikleştirilecekse bu script'in çıktısı (satır sayısı != 0) healthchecks.io'ya ayrı bir "restore-test" check'i olarak bağlanabilir.
