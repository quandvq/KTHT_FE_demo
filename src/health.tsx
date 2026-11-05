import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { healthArticles, healthCategories, type HealthArticle } from './data/health-articles';
import { assetUrl } from './assets';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi-VN').trim().replace(/\s+/g, ' ');
const pageSize = 4;

function Cover({ article, className = '' }: { article: HealthArticle; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={'health-cover '+className+(failed ? ' health-cover-fallback' : '')}>{!failed && <img src={assetUrl(article.coverImage)} alt={article.imageAlt} loading="lazy" onError={() => setFailed(true)} />}{failed && <span aria-label={article.imageAlt}>V</span>}</div>;
}

export function HealthCard({ article, featured = false }: { article: HealthArticle; featured?: boolean }) {
  return <article className={'health-card '+(featured ? 'health-card-featured' : '')}><Cover article={article}/><div className="health-card-body"><span className="health-category">{article.category}</span><h3>{article.title}</h3><p>{article.excerpt}</p><Link to={'/goc-suc-khoe/'+article.slug}>Đọc bài <ChevronRight size={16}/></Link></div></article>;
}

export function HealthHomeSection() {
  const articles = healthArticles.filter(article => article.status === 'PUBLISHED').slice(0, 5);
  if (!articles.length) return null;
  return <section className="health-home-section" aria-labelledby="health-home-title"><div className="section-title"><div><span>GÓC SỨC KHỎE</span><h2 id="health-home-title">Kiến thức sức khỏe mỗi ngày</h2></div><Link to="/goc-suc-khoe">Xem tất cả <ChevronRight size={16}/></Link></div><div className="health-home-grid">{articles.map((article, index) => <HealthCard article={article} featured={index === 0} key={article.id}/>)}</div></section>;
}

export function HealthHub() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = params.get('category') || '';
  const pageParam = Math.max(1, Number(params.get('page') || 1));
  const [draft, setDraft] = useState(query);
  const composing = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => setDraft(query), [query]);
  const update = (next: { q?: string; category?: string; page?: number }) => {
    const output = new URLSearchParams(params);
    const q = next.q === undefined ? query : next.q;
    const selected = next.category === undefined ? category : next.category;
    const page = next.page === undefined ? 1 : next.page;
    if (q) output.set('q', q); else output.delete('q');
    if (selected) output.set('category', selected); else output.delete('category');
    if (page > 1) output.set('page', String(page)); else output.delete('page');
    setParams(output);
  };
  const commit = (value: string) => update({ q: value.trim(), page: 1 });
  const onSearch = (value: string) => { setDraft(value); if (composing.current) return; window.clearTimeout(timer.current); timer.current = window.setTimeout(() => commit(value), 300); };
  const matching = healthArticles.filter(article => article.status === 'PUBLISHED').filter(article => (!category || article.category === category) && (!query || normalize(article.title+' '+article.excerpt+' '+article.category).includes(normalize(query))));
  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const page = Math.min(pageParam, pages);
  const items = matching.slice((page - 1) * pageSize, page * pageSize);
  return <section className="wrap page health-hub"><nav className="crumb">Trang chủ / Góc sức khỏe</nav><div className="health-hub-heading"><div><span>GÓC SỨC KHỎE</span><h1>Kiến thức dễ hiểu cho cuộc sống khỏe mạnh</h1><p>Nội dung thông tin chung, được viết lại từ nguồn tham khảo chính thức; không thay thế tư vấn y tế.</p></div><label className="health-search"><Search size={20}/><span className="sr-only">Tìm kiếm bài viết</span><input value={draft} onChange={event => onSearch(event.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={event => { composing.current = false; setDraft(event.currentTarget.value); commit(event.currentTarget.value); }} placeholder="Tìm bài viết sức khỏe"/></label></div><div className="health-categories" aria-label="Lọc chuyên mục"><button type="button" className={!category ? 'active' : ''} onClick={() => update({ category: '', page: 1 })}>Tất cả</button>{healthCategories.map(item => <button type="button" className={category === item ? 'active' : ''} onClick={() => update({ category: item, page: 1 })} key={item}>{item}</button>)}</div><p className="health-results">{matching.length} bài viết{category && <> trong <b>{category}</b></>}{query && <> cho “<b>{query}</b>”</>}</p>{items.length ? <><div className="health-list-grid">{items.map(article => <HealthCard article={article} key={article.id}/>)}</div>{pages > 1 && <nav className="health-pagination" aria-label="Phân trang bài viết">{Array.from({ length: pages }, (_, index) => index + 1).map(value => <button type="button" className={value === page ? 'active' : ''} aria-current={value === page ? 'page' : undefined} onClick={() => update({ page: value })} key={value}>{value}</button>)}</nav>}</> : <section className="health-empty"><h2>Không tìm thấy bài viết phù hợp</h2><p>Thử một từ khóa khác hoặc bỏ bộ lọc chuyên mục.</p><button type="button" onClick={() => update({ q: '', category: '', page: 1 })}>Xóa tìm kiếm và bộ lọc</button></section>}</section>;
}

export function HealthArticlePage() {
  const { slug } = useParams();
  const article = healthArticles.find(item => item.slug === slug && item.status === 'PUBLISHED');
  if (!article) return <section className="wrap page health-empty"><h1>Không tìm thấy bài viết</h1><p>Đường dẫn có thể đã thay đổi hoặc bài viết chưa được xuất bản.</p><Link className="primary" to="/goc-suc-khoe">Về Góc sức khỏe</Link></section>;
  const related = healthArticles.filter(item => item.status === 'PUBLISHED' && item.id !== article.id).sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category)).slice(0, 3);
  return <article className="wrap page health-article"><nav className="crumb"><Link to="/">Trang chủ</Link> / <Link to="/goc-suc-khoe">Góc sức khỏe</Link> / {article.category}</nav><header><span className="health-category">{article.category}</span><h1>{article.title}</h1><p>{article.excerpt}</p><small>{article.readingMinutes} phút đọc · Nội dung thông tin chung</small></header><Cover article={article} className="health-article-cover"/><div className="health-reading-layout"><aside className="health-toc"><b>Mục lục</b><ol>{article.content.map(section => <li key={section.id}><a href={'#'+section.id}>{section.heading}</a></li>)}</ol></aside><div className="health-content">{article.content.map(section => <section id={section.id} key={section.id}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>)}<aside className="health-disclaimer"><b>Lưu ý</b><p>Nội dung chỉ nhằm cung cấp thông tin chung. Nếu bạn có triệu chứng, bệnh lý hoặc cần lựa chọn sản phẩm phù hợp, hãy trao đổi với dược sĩ hoặc nhân viên y tế.</p></aside><section className="health-sources"><h2>Nguồn tham khảo</h2><ul>{article.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul></section></div></div><section className="health-related"><div className="section-title"><div><span>ĐỌC TIẾP</span><h2>Bài viết liên quan</h2></div><Link to="/goc-suc-khoe">Xem tất cả <ChevronRight size={16}/></Link></div><div className="health-list-grid">{related.map(item => <HealthCard article={item} key={item.id}/>)}</div></section></article>;
}
