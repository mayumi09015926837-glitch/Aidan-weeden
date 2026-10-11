/*
 * ============================================================
 *  ここだけ書きかえてください（設定ファイル）
 *  Fill in this one file. The website (index.html) and the
 *  pamphlet (pamphlet.html / pamphlet.pdf) both read it.
 *
 *  - 空欄 "" のままの項目は、オレンジ色の【…】で表示されます。
 *  - 写真は images/ フォルダに入れて、ファイル名を書いてください。
 *    例: hero: "images/hero.jpg"
 * ============================================================
 */
window.KYOSHITSU_CONFIG = {
  // お問い合わせ
  phone: "",            // 例: "03-1234-5678"（電話ボタンにも使われます）
  receptionHours: "",   // 例: "平日 10:00〜17:00"
  lineUrl: "",          // LINE公式アカウントの友だち追加URL 例: "https://lin.ee/xxxxxxx"

  // 講座のご案内
  dates: "",            // 例: "2027年1月15日から毎週金曜日"
  startTime: "",        // 例: "午後2時"
  venueName: "",        // 例: "〇〇市民センター 2階 会議室"
  venueAddress: "",     // 例: "〇〇市〇〇町1-2-3"（「地図を見る」ボタンにも使われます）
  mapUrl: "",           // 空欄なら住所からGoogleマップを自動で開きます。決まった地図URLがあればここに
  seats: "",            // 例: "6"
  price: "",            // 例: "29,800"

  // 講師
  instructorName: "",   // 例: "山田 花子"
  instructorBio: "同志社大学 経済学部の学生です。分からないことは、何度でも聞いてください。", // 例: "元・商店街の店主。スマホ教室の講師歴5年。"

  // 主催者
  organizerName: "",    // 例: "〇〇デジタル相談室"
  organizerAddress: "", // 例: "〇〇県〇〇市〇〇町1-2-3"

  // 写真（なければ空欄のままで大丈夫です。イラストが表示されます）
  images: {
    hero: "",           // トップの写真         例: "images/hero.jpg"
    instructor: "",     // 講師の写真           例: "images/instructor.jpg"
    classPhoto: "",     // 教室の様子の写真     例: "images/class.jpg"
    lineQr: ""          // LINEのQRコード画像   例: "images/line-qr.png"
  }
};
