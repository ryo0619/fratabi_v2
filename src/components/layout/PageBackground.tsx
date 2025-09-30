"use client";

import Image from "next/image";

export default function PageBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <Image
        src="/ChatGPT_image_fratabi_v2_top.png"
        alt=""
        fill
        priority
        className="
          object-cover lg:object-contain
          transform lg:object-cover
          [object-position:60%_40%]
          md:[object-position:55%_35%]
          lg:[object-position:50%_35%]
          portrait:[object-position:50%_35%]
          landscape:[object-position:60%_50%]
        "
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/70 via-white/30 to-transparent dark:from-black/50 dark:vis-black/20" />
    </div>
  );
}
