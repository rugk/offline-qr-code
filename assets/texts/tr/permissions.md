# Gerekli izinler

Eklenti izinleriyle ilgili genel açıklama için [bu yazıya gözat](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Yüklenen izinler

Kurulum ve güncelleme sırasında hiç bir izin talep edilmemektedir.

## Özellik bazlı (opsiyonel) izinler

Bu izinler bazı spesifik özellikleri kullanırken ihtiyaç duyulması halinde eklenti tarafından talep edilir.

| Dahili Id   | İzin                                                                           | Talep eden                 | Açıklama                                                                                                                                                                                                       |
|:------------|:-------------------------------------------------------------------------------|:---------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `downloads` | Dosya indirmek ve tarayıcının dosya indirme geçmişini görüntüleme ve düzenleme | QR kodu SVG olarak indirme | SVG dosyasını indirmek ve kullanıcıya dosyanın kaydedileceği yeri seçme imkanı sağlamak için gereklidir. Bu eklenti indirilmiş dosyalarınıza erişmez. Bu izni sadece indirme işlemini başlatmak için kullanır. |

## Gizli izinler
Bu eklenti ek olarak aşağıdaki izinleri de talep etmektedir. Bu izinler eklenti Firefox'a kurulurken kullanıcıdan talep edilmez çünkü bu izinler önemli izin olarak değerlendirilmemektedir.

| Dahili Id   | İzin                         | Açıklama                                                                                |
|:------------|:-----------------------------|:----------------------------------------------------------------------------------------|
| `activeTab` | Güncel sekmeye erişim        | QR kod için aktif sekmenin adresine erişmek için gereklidir.                            |
| `storage`   | Yerel depoya erişim          | Ayarları kaydetmek için gereklidir.                                                     |
| `menus`     | Tarayıcı içerik menüsü       | "Seçili metinden QR kod üret" gibi seçenekleri içerik menüsüne eklemek için gereklidir. |
