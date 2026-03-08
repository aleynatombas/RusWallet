Fiş OCR için Tesseract tessdata dosyası gerekir.

1. eng.traineddata dosyasını indirin (yaklaşık 25 MB):
   https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata

2. Bu dosyayı bu klasöre (tessdata) koyun:
   RusWallet.API\tessdata\eng.traineddata

3. Projeyi derleyip çalıştırın. tessdata klasörü uygulama çıktısına kopyalanır.

4. appsettings.json içinde Receipt:UseMock = false olmalı (gerçek OCR için).

Not: Windows'ta Tesseract NuGet bazen native kütüphaneleri ile gelir. Eğer "OCR başlatılamadı" hatası alırsanız,
https://github.com/UB-Mannheim/tesseract/wiki adresinden Tesseract'ı kurup
Receipt:TesseractDataPath ile tessdata yolunu gösterebilirsiniz.
