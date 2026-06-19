import { useState, useEffect } from 'react';

/* Проверяет наличие картинки запросом fetch — отсутствующие фото не
   засоряют консоль ошибками 404 от <img>. */
export default function useImageProbe(src) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let live = true;
    fetch(src)
      .then((r) => {
        const ct = r.headers.get('content-type') || '';
        if (live) setOk(r.ok && ct.indexOf('image') === 0);
      })
      .catch(() => {
        if (live) setOk(false);
      });
    return () => {
      live = false;
    };
  }, [src]);
  return ok;
}
