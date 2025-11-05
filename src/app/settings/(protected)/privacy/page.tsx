export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">プライバシーポリシー</h1>
      <h2>フラたびの個人情報保護について</h2>

      <div className="space-y-6 text-sm text-neutral-800 leading-relaxed">
        <p className="text-neutral-700">
          <strong>最終更新日：2025年11月3日</strong>
        </p>
        <p className="text-neutral-700">
          本プライバシーポリシー（以下「本ポリシー」）は、フラたび運営（以下「当方」）が提供するWebサービス
          「フラたび（fratabi）」（以下「本サービス」）における、ユーザー（以下「ユーザー」）の個人情報および関連情報の取扱いについて定めるものです。
        </p>

        <hr className="border-neutral-200" />

        {/* 1. 取得する情報 */}
        <section className="space-y-3">
          <h3 className="font-semibold">1. 取得する情報</h3>
          <p>本サービスは、次の情報を取得する場合があります。</p>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium">（1）ユーザーが直接提供する情報</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>アカウント登録時の情報（表示名、メールアドレス等）</li>
                <li>
                  入力テキスト（日本語）、翻訳結果、ふりがな、音声（TTS）、タイトル・メモ等
                </li>
                <li>お問い合わせ等で送信された内容</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">（2）技術情報・Cookie等</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Cookie・ローカルストレージ（セッション管理、設定保持、利便性向上のため）
                </li>
                <li>
                  アクセスログ（IPアドレス、ブラウザ種別、OS、リファラ、アクセス日時、操作イベント、エラーログ等）を記録しますが、これらは個人を特定するものではありません。
                </li>
                <li>
                  端末内キャッシュ（オフライン機能等でIndexedDBやCache
                  Storageを利用する場合があります）
                </li>
              </ul>
              <p className="mt-2 text-neutral-700">
                ブラウザの設定でCookieを無効化できますが、一部機能が利用できない場合があります。
              </p>
            </div>

            <div>
              <h4 className="font-medium">（3）決済関連情報</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>有料プラン利用時、決済は外部事業者を通じて行われます。</li>
                <li>
                  当方はクレジットカード番号等の完全なカード情報を保持しません。
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">2. 情報の利用目的</h3>
          <p>当方は取得した情報を、以下の目的のために利用します。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>本サービスの提供・運営・認証（ログイン）・本人確認</li>
            <li>
              翻訳・ふりがな付与・音声合成（TTS）等の機能実行および品質向上
            </li>
            <li>
              問い合わせ対応、重要なお知らせの通知、障害・メンテナンス情報の提供
            </li>
            <li>利用状況の把握、機能改善、パフォーマンス・セキュリティ向上</li>
            <li>不正利用・濫用の監視・防止、利用規約違反への対応</li>
            <li>有料プランの課金・決済・請求処理</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">3. 第三者提供・共同利用</h3>
          <p>
            当方は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>法令に基づく場合、司法・行政からの正当な要請がある場合</li>
            <li>
              人の生命・身体・財産の保護のために必要で、本人同意が困難な場合
            </li>
            <li>
              本サービスの運営に必要な範囲で、業務委託先に提供する場合。当方は委託先に対し、必要かつ適切な監督を行います。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">4. AI API への送信について</h3>
          <p>
            翻訳・ふりがな・音声合成等の処理のため、当方は入力テキストや音声関連データをAI提供者（例：OpenAI
            API）へ送信する場合があります。
            当方は、可能な設定・契約の範囲で、学習目的への利用が行われないよう配慮しますが、提供者側における安全対策上の一時的な保持や不正検知のための利用が行われる場合があります。
            提供者のポリシーや仕様変更があれば、アプリ内掲示等でお知らせします。
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">5. 保管場所・セキュリティ</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              ユーザーデータはクラウド環境に保管され、通信は原則TLSにより暗号化されます。
            </li>
            <li>
              認可・権限制御（最小権限、行単位/列単位の制御等）や監査ログ等、合理的な安全管理措置を講じます。
            </li>
            <li>
              一部の音声ファイル等が公開バケットに保存される場合があり、URLを知る第三者がアクセス可能となることがあります（将来的に署名付きURL等へ移行する可能性があります）。
            </li>
            <li>
              オフライン機能等により、端末内（IndexedDB等）へキャッシュされる場合があります。共有端末ではご注意ください。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">6. 国外へのデータ移転</h3>
          <p>
            本サービスで利用するクラウド/外部事業者のサーバーは、ユーザーの居住国以外（例：日本国外）に設置されている可能性があります。
            当方は関連法令に従い、適切な保護措置を講じます。
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">7. 保存期間</h3>
          <p>
            個人情報は、利用目的の達成に必要な期間、または法令で定められた期間保存します。アカウント削除後も、法令遵守・紛争対応・不正防止等のため、必要最小限の情報を一定期間保持する場合があります。
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">8. ユーザーの権利</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              アカウント画面等で、登録情報や保存データの閲覧・修正・削除が可能です。
            </li>
            <li>
              アカウント自体の削除を希望する場合は、お問い合わせよりご連絡ください。
            </li>
            <li>
              Cookieの利用はブラウザ設定で制御できます（機能制限が生じる場合あり）。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">9. 未成年の利用</h3>
          <p>
            未成年者は、法定代理人の同意を得たうえで本サービスをご利用ください。
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">10. 事業の承継</h3>
          <p>
            合併、会社分割、事業譲渡その他の事由により事業が承継される場合、利用目的の範囲内で個人情報を承継先へ移転することがあります。
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">11. 本ポリシーの変更</h3>
          <p>
            当方は、法令改正やサービス内容の変更等に応じて本ポリシーを改定することがあります。重要な変更がある場合は、アプリ内掲示等の適切な方法でお知らせします。
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">12. お問い合わせ</h3>
          <p>
            本ポリシーに関するご質問・開示/訂正/削除のご依頼は、アプリ内の「設定＞お問い合わせ」または当方が指定する窓口よりご連絡ください。
          </p>
          <p>
            <a
              href="/contact"
              className="underline text-neutral-700 hover:text-neutral-900"
            >
              お問い合わせページへ
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
