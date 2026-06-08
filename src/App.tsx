import { useEffect, useState } from "react";
import "./App.css";

type Repo = {
    id: number;
    name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    updated_at: string;
    homepage: string | null;
};

type StatusFilter = "all" | "ready" | "needsWork" | "selected";

function App() {
    const [username, setUsername] = useState("");
    const [searchedUsername, setSearchedUsername] = useState("");
    const [repos, setRepos] = useState<Repo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [copyMessage, setCopyMessage] = useState("");

    const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>(() => {
        const savedSelectedRepoIds = localStorage.getItem("repo-fit-selected-repo-ids");

        if (savedSelectedRepoIds === null) {
            return [];
        }

        return JSON.parse(savedSelectedRepoIds);
    });

    const [repoNotes, setRepoNotes] = useState<Record<number, string>>(() => {
        const savedRepoNotes = localStorage.getItem("repo-fit-repo-notes");

        if (savedRepoNotes === null) {
            return {};
        }

        return JSON.parse(savedRepoNotes);
    });

    const [toastMessage, setToastMessage] = useState("");
    const [repoSearchText, setRepoSearchText] = useState("");

    useEffect(() => {
        localStorage.setItem("repo-fit-selected-repo-ids", JSON.stringify(selectedRepoIds));
    }, [selectedRepoIds]);

    useEffect(() => {
        localStorage.setItem("repo-fit-repo-notes", JSON.stringify(repoNotes));
    }, [repoNotes]);

    async function handleSearch() {
        const trimmedUsername = username.trim();

        if (trimmedUsername === "") {
            alert("GitHub 아이디를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");
        setCopyMessage("");
        setRepos([]);
        setStatusFilter("all");
        setSearchedUsername("");
        setRepoSearchText("");

        try {
            const response = await fetch(`https://api.github.com/users/${trimmedUsername}/repos`);

            // fetch는 404가 와도 자동으로 catch로 가지 않기 때문에 response.ok를 직접 확인한다.
            if (!response.ok) {
                throw new Error("저장소를 불러오지 못했습니다.");
            }

            const data: Repo[] = await response.json();

            setRepos(data);
            setSearchedUsername(trimmedUsername);
            setUsername("");
        } catch {
            setErrorMessage("GitHub 저장소를 불러오는 중 문제가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleToggleCandidate(repoId: number) {
        setSelectedRepoIds((prevSelectedIds) => {
            if (prevSelectedIds.includes(repoId)) {
                return prevSelectedIds.filter((id) => id !== repoId);
            }

            return [...prevSelectedIds, repoId];
        });
    }

    function handleChangeRepoNote(repoId: number, noteText: string) {
        setRepoNotes((prevNotes) => {
            return {
                ...prevNotes,
                [repoId]: noteText,
            };
        });
    }

    const visibleRepos = repos.filter((repo) => {
        const hasLanguage = repo.language !== null;
        const homepageUrl = repo.homepage?.trim() ?? "";
        const hasHomepage = homepageUrl !== "";
        const isPortfolioReady = hasLanguage && hasHomepage;
        const normalizedSearchText = repoSearchText.trim().toLowerCase();
        const matchesSearchText =
            normalizedSearchText === "" ||
            repo.name.toLowerCase().includes(normalizedSearchText) ||
            (repo.description ?? "").toLowerCase().includes(normalizedSearchText);

        if (!matchesSearchText) {
            return false;
        }

        if (statusFilter === "all") {
            return true;
        }

        if (statusFilter === "ready") {
            return isPortfolioReady;
        }

        if (statusFilter === "selected") {
            return selectedRepoIds.includes(repo.id);
        }

        return !isPortfolioReady;
    });

    const selectedRepos = repos.filter((repo) => {
        return selectedRepoIds.includes(repo.id);
    });

    const readyRepos = repos.filter((repo) => {
        const hasLanguage = repo.language !== null;
        const homepageUrl = repo.homepage?.trim() ?? "";
        const hasHomepage = homepageUrl !== "";

        return hasLanguage && hasHomepage;
    });

    const totalRepoCount = repos.length;
    const readyRepoCount = readyRepos.length;
    const needsWorkRepoCount = totalRepoCount - readyRepoCount;
    const selectedRepoCount = selectedRepos.length;

    function createRepoMarkdown(repo: Repo) {
        const note = repoNotes[repo.id] ?? "작성한 메모가 없습니다.";
        const homepageUrl = repo.homepage?.trim() ?? "";
        const descriptionText = repo.description?.trim() ?? "";

        return `## ${repo.name}

- 설명: ${descriptionText !== "" ? descriptionText : "등록된 설명 없음"}
- GitHub: ${repo.html_url}
- 배포 링크: ${homepageUrl !== "" ? homepageUrl : "없음"}
- 사용 언어: ${repo.language ?? "언어 정보 없음"}
- 최근 업데이트: ${repo.updated_at}
- 메모: ${note}`;
    }

    async function handleCopyRepoMarkdown(repo: Repo) {
        const repoMarkdown = createRepoMarkdown(repo);

        try {
            await navigator.clipboard.writeText(repoMarkdown);

            setToastMessage("카드 요약을 복사했습니다.");

            setTimeout(() => {
                setToastMessage("");
            }, 1500);
        } catch {
            setToastMessage("프로젝트 요약 복사에 실패했습니다.");

            setTimeout(() => {
                setToastMessage("");
            }, 1500);
        }
    }

    function createMarkdownSummary() {
        if (selectedRepos.length === 0) {
            return "선택한 포트폴리오 후보가 없습니다.";
        }

        return selectedRepos
            .map((repo, index) => {
                const note = repoNotes[repo.id] ?? "작성한 메모가 없습니다.";
                const homepageUrl = repo.homepage?.trim() ?? "";

                return `## ${index + 1}. ${repo.name}

- GitHub: ${repo.html_url}
- 배포 링크: ${homepageUrl !== "" ? homepageUrl : "없음"}
- 사용 언어: ${repo.language ?? "언어 정보 없음"}
- 최근 업데이트: ${repo.updated_at}
- 메모: ${note}`;
            })
            .join("\n\n");
    }

    async function handleCopyMarkdownSummary() {
        const markdownSummary = createMarkdownSummary();

        try {
            await navigator.clipboard.writeText(markdownSummary);
            setCopyMessage("마크다운 요약을 복사했습니다.");
            setToastMessage("선택 후보 마크다운을 복사했습니다.");
        } catch {
            setCopyMessage("마크다운 요약 복사에 실패했습니다.");
            setToastMessage("마크다운 요약 복사에 실패했습니다.");
        }
    }

    return (
        <main className="app">
            <section className="app-header">
                <h1>RepoFit</h1>
                <p>GitHub 저장소를 포트폴리오 관점에서 점검해보세요.</p>
            </section>

            <section className="search-section">
                <input
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                    }}
                    placeholder="GitHub 아이디를 입력하세요."
                />

                <button onClick={handleSearch} disabled={username.trim() === ""}>
                    저장소 불러오기
                </button>
            </section>

            {isLoading && <p>저장소를 불러오는 중입니다...</p>}

            {errorMessage !== "" && <p>{errorMessage}</p>}
            {searchedUsername !== "" && (
                <p className="searched-user">
                    검색한 GitHub 아이디: <strong>{searchedUsername}</strong>
                </p>
            )}
            {repos.length > 0 && (
                <section className="dashboard-section">
                    <div>
                        <strong>{totalRepoCount}</strong>
                        <span>전체 저장소</span>
                    </div>

                    <div>
                        <strong>{readyRepoCount}</strong>
                        <span>기본 조건 충족</span>
                    </div>

                    <div>
                        <strong>{needsWorkRepoCount}</strong>
                        <span>보완 필요</span>
                    </div>

                    <div>
                        <strong>{selectedRepoCount}</strong>
                        <span>포트폴리오 후보</span>
                    </div>
                </section>
            )}

            {repos.length > 0 && (
                <section className="filter-section">
                    <button
                        onClick={() => {
                            setStatusFilter("all");
                        }}
                        className={statusFilter === "all" ? "active-filter" : ""}
                    >
                        전체
                    </button>

                    <button
                        onClick={() => {
                            setStatusFilter("selected");
                        }}
                        className={statusFilter === "selected" ? "active-filter" : ""}
                    >
                        후보
                    </button>

                    <button
                        onClick={() => {
                            setStatusFilter("ready");
                        }}
                        className={statusFilter === "ready" ? "active-filter" : ""}
                    >
                        기본 조건 충족
                    </button>

                    <button
                        onClick={() => {
                            setStatusFilter("needsWork");
                        }}
                        className={statusFilter === "needsWork" ? "active-filter" : ""}
                    >
                        보완 필요
                    </button>
                </section>
            )}
            {repos.length > 0 && (
                <section className="repo-search-section">
                    <input
                        value={repoSearchText}
                        onChange={(e) => {
                            setRepoSearchText(e.target.value);
                        }}
                        placeholder="저장소 이름 또는 설명으로 필터링하세요. 예: react"
                    />
                </section>
            )}
            {repos.length > 0 && (
                <section className="summary-section">
                    <button onClick={handleCopyMarkdownSummary} disabled={selectedRepos.length === 0}>
                        선택 후보 마크다운 복사
                    </button>

                    {copyMessage !== "" && <p>{copyMessage}</p>}
                </section>
            )}

            {repos.length > 0 && visibleRepos.length === 0 && (
                <section className="empty-state">
                    <h2>조건에 맞는 저장소가 없습니다.</h2>
                    <p>검색어를 바꾸거나 다른 필터를 선택해보세요.</p>
                </section>
            )}
            <section className="repo-list">
                {visibleRepos.map((repo) => {
                    const descriptionText = repo.description?.trim() ?? "";
                    const hasDescription = descriptionText !== "";
                    const hasLanguage = repo.language !== null;

                    const homepageUrl = repo.homepage?.trim() ?? "";
                    const hasHomepage = homepageUrl !== "";

                    const isPortfolioReady = hasLanguage && hasHomepage;
                    const isSelected = selectedRepoIds.includes(repo.id);

                    return (
                        <article key={repo.id} className={isSelected ? "repo-card selected-card" : "repo-card"}>
                            <h2>{repo.name}</h2>

                            {hasDescription && <p>{descriptionText}</p>}

                            <p className="repo-meta">사용 언어: {repo.language ?? "언어 정보 없음"}</p>
                            <p className="repo-meta">최근 업데이트: {repo.updated_at}</p>

                            <div className="repo-check-list">
                                <p>{hasDescription ? "저장소 설명 있음" : "저장소 설명 보완 권장"}</p>
                                <p>{hasLanguage ? "언어 있음" : "언어 없음"}</p>
                                <p>{hasHomepage ? "배포 링크 있음" : "보완 필요! 배포 링크 없음"}</p>
                            </div>

                            <p className={isPortfolioReady ? "ready" : "not-ready"}>
                                {isPortfolioReady ? "포트폴리오 기본 조건 충족" : "보완 필요"}
                            </p>

                            <div className="repo-actions">
                                <button
                                    className={isSelected ? "candidate-button selected" : "candidate-button"}
                                    onClick={() => {
                                        handleToggleCandidate(repo.id);
                                    }}
                                >
                                    {isSelected ? "후보에서 제거" : "후보 추가"}
                                </button>

                                <button
                                    className="copy-card-button"
                                    onClick={() => {
                                        handleCopyRepoMarkdown(repo);
                                    }}
                                >
                                    카드 요약 복사
                                </button>

                                <a
                                    className="repo-action-link"
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    GitHub 보기
                                </a>

                                {hasHomepage && (
                                    <a
                                        className="repo-action-link"
                                        href={homepageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        배포 링크 보기
                                    </a>
                                )}
                            </div>

                            <textarea
                                className="repo-note"
                                value={repoNotes[repo.id] ?? ""}
                                onChange={(e) => {
                                    handleChangeRepoNote(repo.id, e.target.value);
                                }}
                                placeholder="이 저장소에 대한 메모를 적어보세요. 예: README 보완 필요"
                            />
                        </article>
                    );
                })}
            </section>
            {toastMessage !== "" && <div className="toast-message">{toastMessage}</div>}
        </main>
    );
}

export default App;

// 버튼 클릭 -> GitHub API 요청 -> JSON 응답 받기 -> repos state에 저장
// visibleRepos로 필터링 -> 화면에 map으로 출력
// 후보 선택, 메모, localStorage 저장, Markdown 복사 기능을 관리한다.
