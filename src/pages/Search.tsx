import { useSearchParams } from 'react-router-dom';
import { searchAnime } from '../api/jikan';
import AnimeGrid from '../components/AnimeGrid';
import { useAsync } from '../hooks/useAsync';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1);

  const result = useAsync(() => (q ? searchAnime(q, page) : Promise.resolve(null)), [q, page]);
  const hasNext = result.data?.pagination.has_next_page;

  return (
    <div className="page">
      <h1 className="section-title">Results for “{q}”</h1>
      <AnimeGrid loading={result.loading} error={result.error} anime={result.data?.data} />
      {(page > 1 || hasNext) && (
        <div className="row gap center pager">
          <button className="btn ghost" disabled={page <= 1} onClick={() => setParams({ q, page: String(page - 1) })}>
            ← Previous
          </button>
          <span className="muted">Page {page}</span>
          <button className="btn ghost" disabled={!hasNext} onClick={() => setParams({ q, page: String(page + 1) })}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
