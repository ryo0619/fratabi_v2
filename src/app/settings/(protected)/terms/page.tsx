export const dynamic = "force-dynamic";

export default function TermsOfServicePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">利用規約</h1>
      <h2>利用規約　フラたび</h2>
      <div className="space-y-6 text-sm text-neutral-800 leading-relaxed">
        <p className="text-neutral-700">
          <strong>施行日：2025年11月3日</strong>
        </p>
        <p className="text-neutral-700">
          この利用規約（以下「本規約」）は、フラたび運営（以下「当方」）が提供するWebサービス「フラたび（fratabi）」（以下「本サービス」）の利用条件を定めるものです。ユーザー（以下「ユーザー」）は、本サービスを利用することにより、本規約のすべてに同意したものとみなされます。未同意の場合は本サービスをご利用いただけません。
        </p>

        <hr className="border-neutral-200" />

        <section className="space-y-3">
          <h3 className="font-semibold">第1条（定義）</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              フレーズ：ユーザーが日本語で入力した文と、その英語・フランス語訳、ふりがな情報、音声（TTS）データを一体として指します。
            </li>
            <li>
              カード：本サービス上で表示・保存されるフレーズ単位のUIコンポーネント。
            </li>
            <li>スレッド：複数のカードを論理的にまとめ、共有できる単位。</li>
            <li>
              招待リンク：他者を特定のスレッドに参加させるための期限付きリンク。
            </li>
            <li>
              ユーザーコンテンツ：ユーザーが本サービスに入力・アップロード・保存する全情報（日本語入力文、翻訳結果の編集内容、タイトル、説明等）。
            </li>
            <li>
              生成コンテンツ：本サービスがAI等により生成する翻訳文、ふりがな、音声（TTS）等。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第2条（本サービスの内容）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              本サービスは、日本語入力に対し、フランス語翻訳、ふりがな付与、音声合成（TTS）を行い、フレーズをカードとして保存・再生できるプラットフォームです。
            </li>
            <li>
              主な機能：文章入力→翻訳→TTS生成→カード保存／スレッドの作成・名称変更・削除、メンバー招待／お気に入り、横断ビュー、オフライン一覧（※TTS再生はネット接続が必要）／利用回数の可視化（プラン/残回数など）。
            </li>
            <li>
              詳細仕様・制限は、アプリ内の表示・ガイド・ヘルプ等で随時定めます。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第3条（アカウント登録・管理）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              本サービスの利用には、対応する認証手段（例：Googleログイン）によるアカウント登録が必要となる場合があります。
            </li>
            <li>
              ユーザーは、登録情報を正確かつ最新に保ち、認証情報の管理・保護に責任を負います。
            </li>
            <li>
              アカウントの不正使用により生じた損害について、当方は責任を負いません。
            </li>
            <li>未成年者は、法定代理人の同意を得たうえで利用してください。</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第4条（プラン／利用回数の上限）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              本サービスは、無料プラン（free）および有料プラン（pro）等を提供します。各プランの上限は以下のとおりです。
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>free：合計 20回</li>
                <li>pro：毎月合計 100回（毎月1日に自動リセット）</li>
              </ul>
            </li>
            <li>
              「回数」は、翻訳の実行を1カウントとします。上限超過時は当該期間の処理が実行できません。
            </li>
            <li>
              有料プランの提供内容・価格・上限は、予告なく変更される場合があります。変更時はアプリ内等でお知らせします。
            </li>
            <li>
              不正な手段による上限回避（複数アカウントの作成・共有等）は禁止します。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第5条（料金・支払い・解約）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              有料プランの料金は、表示価格に従い、決済事業者の定める方法でお支払いください。
            </li>
            <li>
              サブスクリプションの管理（プラン変更・解約等）は、設定画面から行ってください。
            </li>
            <li>
              期間途中の解約でも、既払金の返金は行いません（法令で認められる場合を除く）。
            </li>
            <li>
              決済の失敗・不払い等があった場合、当方は本サービスの提供を停止または解約できます。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">
            第6条（ユーザーコンテンツと生成コンテンツの取扱い）
          </h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              <span className="font-semibold">権利帰属：</span>
              ユーザーコンテンツおよび生成コンテンツ（ユーザーによる編集を含む）の著作権等は、原則として当該ユーザーに帰属します。ただし、第三者の権利を侵害せず、適用法令に反しないことをユーザーが保証するものとします。
            </li>
            <li>
              <span className="font-semibold">利用許諾：</span>
              当方は本サービスの提供・運営・改善・安全確保の目的で、当該コンテンツを複製・保存・解析・表示・改変（形式変換等）し、必要範囲で第三者サービス（ホスティング、AI提供、決済等）に再提供できるものとします。
            </li>
            <li>
              <span className="font-semibold">公開範囲：</span>
              音声ファイル等は公開バケットに保存される場合があり、URLを知る第三者がアクセス可能となることがあります（将来、署名付きURL等に移行する可能性あり）。オフライン機能により端末内にキャッシュされる場合があります。
            </li>
            <li>
              当方は、法令または本規約に違反すると判断したコンテンツについて、事前通知なく削除・非表示・アクセス制限等の措置を講じることができます。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第7条（スレッド共有と責任）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              ユーザーは招待リンクで他者をスレッドに参加させることができます。招待リンクの管理・配布はユーザーの責任で行い、無差別公開は避けてください。
            </li>
            <li>
              スレッド内のコンテンツは参加メンバーが閲覧可能です。共有範囲・機密性に留意してください。
            </li>
            <li>
              スレッドの所有者は、メンバー管理、権限設定、コンテンツの適切性について最終責任を負います。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第8条（禁止事項）</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為、またはそれを準備・助長・示唆する行為</li>
            <li>
              第三者または当方の知的財産権、プライバシー、名誉、信用、その他権利・利益を侵害する行為
            </li>
            <li>
              本サービスのサーバー・ネットワーク・セキュリティを妨害・不正操作する行為（リバースエンジニアリング、脆弱性探索、APIキーの不正取得・共有等）
            </li>
            <li>
              運営を妨げる行為（過度なアクセス、スクレイピング、レート制限の回避、ベンチマーク結果の無断公表等）
            </li>
            <li>不正アクセス、またはこれを試みる行為</li>
            <li>他ユーザーの個人情報等を無断で収集・蓄積・公開する行為</li>
            <li>反社会的勢力等への利益供与、または関与</li>
            <li>その他、当方が不適切と判断する行為</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第9条（第三者サービスの利用）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              本サービスはAI提供、ホスティング、認証、決済等のため第三者サービスを利用します。これらの停止・変更・障害により本サービスが利用できない場合でも、当方は責任を負いません。
            </li>
            <li>
              第三者サービスに適用される規約・ポリシーは各提供者の定めに従います。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">
            第10条（サービスの変更・中断・終了）
          </h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              当方は、システム保守、機能追加・変更、法令対応、災害・停電・通信障害・その他不可抗力等の事由により、事前通知なく本サービスの全部または一部の提供を変更・中断・終了できます。
            </li>
            <li>
              前項に基づく変更・中断・終了により生じた損害について、当方は責任を負いません。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第11条（保証の否認・免責）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              当方は、本サービスに事実上または法律上の瑕疵（安全性・信頼性・正確性・完全性・有用性・特定目的適合性・セキュリティ等に関する欠陥、エラー・バグ、権利非侵害を含む）がないことを保証しません。
            </li>
            <li>
              翻訳・ふりがな・音声出力には誤りが含まれ得ます。医療・法務・安全保障等の高リスク用途での利用は避け、自己の責任と判断でご利用ください。
            </li>
            <li>
              ユーザーコンテンツおよび生成コンテンツの完全な保存・保全は保証しません。重要なデータはユーザーの責任でバックアップしてください。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第12条（責任の制限）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              当方は、本サービスの利用に関連してユーザーに生じた一切の損害（間接・特別・結果的損害、逸失利益、データ消失等）について、当方に故意または重過失がある場合を除き、責任を負いません。
            </li>
            <li>
              強行法規により責任制限が無効・制限される場合、当方の責任は、当該ユーザーが直近12か月に当方へ実際に支払った対価総額（有料プランがない場合は0円）を上限とします。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第13条（アカウントの停止・解約）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              ユーザーが本規約に違反した場合、当方は事前通知なくアカウント停止・制限・解約等の措置を講じることができます。
            </li>
            <li>
              ユーザーは所定の手続により解約できます。解約後も、法令または運営上必要な範囲でデータを一定期間保持することがあります。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第14条（規約の変更）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              当方は必要と判断した場合、ユーザーへの事前通知（アプリ内掲示等）を行ったうえで本規約を変更できます。変更後の本規約は、当方が別途定める効力発生日から適用されます。
            </li>
            <li>
              変更後にユーザーが本サービスを利用した場合、変更に同意したものとみなします。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第15条（準拠法・裁判管轄）</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>本規約の準拠法は日本法とします。</li>
            <li>
              本サービスに関して紛争が生じた場合、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">
            第16条（分離可能性・譲渡禁止・完全合意）
          </h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              本規約の一部が無効・違法・執行不能と判断されても、その他の条項の有効性には影響しません。
            </li>
            <li>
              ユーザーは、当方の事前の書面同意なく、本規約上の地位または権利義務を第三者に譲渡・移転できません。当方は事業譲渡等に伴い本規約上の地位を第三者へ移転できるものとします。
            </li>
            <li>
              本規約は、本サービスに関する当方とユーザーの完全な合意を構成し、従前の合意に優先します。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">第17条（お問い合わせ）</h3>
          <p>
            本規約に関するお問い合わせは、アプリ内の「設定＞お問い合わせ」、または当方が指定する窓口よりご連絡ください。
          </p>
        </section>

        <p className="text-neutral-600">
          附則：本規約は2025年11月3日に制定・施行しました。
        </p>
      </div>
    </div>
  );
}
