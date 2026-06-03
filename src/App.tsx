import { useState } from "react";
import "./App.css";

function App() {
    const [username, setUsername] = useState("");

    function handleSearch() {
        const trimmedUsername = username.trim();

        if (trimmedUsername === "") {
            alert("GitHub 아이디를 입력해주세요.");
            return;
        }

        console.log("검색할 GitHub 아이디:", trimmedUsername);
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
                    placeholder="GitHub 아이디를 입력하세요. 예: Jinhani"
                />

                <button onClick={handleSearch} disabled={username.trim() === ""}>
                    저장소 불러오기
                </button>
            </section>

            <p className="current-value">현재 입력값: {username}</p>
        </main>
    );
}

export default App;
