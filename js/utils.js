/** Shared homework grouping and chapter detection. */
(function (global) {
    function stripHalfLessonPrefix(title) {
        const m = title.match(/^\s*1(?:\/|:)2\b/);
        if (!m) {
            return { rest: title.trim(), halfLesson: false };
        }
        const rest = title.slice(m[0].length).replace(/^[\s._-]+/, '').trim();
        return { rest: rest || title.trim(), halfLesson: true };
    }

    function normalizeForChapter(text) {
        return stripHalfLessonPrefix(text).rest;
    }

    /** All chapter numbers inferred from title and/or filename. */
    function getChapterNumbers(item) {
        const chapters = new Set();
        const texts = [item.title];
        if (item.filename) texts.push(item.filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));

        for (const raw of texts) {
            const text = normalizeForChapter(raw);
            // Year 10 exercises live only under Unsorted Work, not in any chapter
            if (hasYear10(text)) continue;

            const chapterRe = /Chapter\s+(\d+)/gi;
            let m;
            while ((m = chapterRe.exec(text)) !== null) {
                chapters.add(parseInt(m[1], 10));
            }
            const exMatch = text.match(/Exercise\s+(\d+)/i);
            if (exMatch) {
                chapters.add(parseInt(exMatch[1], 10));
            }
        }
        return [...chapters].sort((a, b) => a - b);
    }

    function belongsToChapter(item, chapterNum) {
        return getChapterNumbers(item).includes(chapterNum);
    }

    function isProgressQuiz(title) {
        return /progress\s+quiz/i.test(normalizeForChapter(title));
    }

    function isChapterReview(title) {
        return /chapter\s+review/i.test(normalizeForChapter(title));
    }

    function isStandardExercise(title) {
        return /^Exercise\s+\d+[A-Za-z]/i.test(normalizeForChapter(title));
    }

    function hasYear10(title) {
        return /year\s+10/i.test(normalizeForChapter(title));
    }

    /** Homework in a chapter that does not fit quiz / review / standard exercise. */
    function isUnsortedWork(item) {
        const title = item.title;
        if (hasYear10(title)) return false;
        if (isProgressQuiz(title) || isChapterReview(title) || isStandardExercise(title)) {
            return false;
        }
        return belongsToChapter(item, item._chapterFilter);
    }

    function groupData(data) {
        const groups = new Map();

        data.forEach(item => {
            const { rest: titleForParts, halfLesson } = stripHalfLessonPrefix(item.title);
            const match = titleForParts.match(/^(.*?)(?:\s*-?\s*(?:Part|Pt)\s*(\d+))?$/i);
            const baseTitle = match[1].trim() || titleForParts;
            const partNum = match[2] ? parseInt(match[2], 10) : 1;

            if (!groups.has(baseTitle)) {
                groups.set(baseTitle, {
                    title: baseTitle,
                    mtime: item.mtime,
                    halfLesson: false,
                    parts: []
                });
            }

            const group = groups.get(baseTitle);
            group.parts.push({ ...item, partNum });

            if (halfLesson) group.halfLesson = true;
            if (item.mtime > group.mtime) group.mtime = item.mtime;
        });

        return Array.from(groups.values()).map(group => {
            group.parts.sort((a, b) => a.partNum - b.partNum);
            return group;
        });
    }

    function sortTitleZA(a, b) {
        return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
    }

    function sortChapterHomework(groups, chapterNum) {
        const tagged = groups.map(g => ({ ...g, _chapterFilter: chapterNum }));
        const unsorted = tagged.filter(g => isUnsortedWork(g));
        const sorted = tagged.filter(g => !isUnsortedWork(g));

        const progressQuiz = sorted.filter(g => isProgressQuiz(g.title)).sort(sortTitleZA);
        const chapterReview = sorted.filter(g => isChapterReview(g.title)).sort(sortTitleZA);
        const exercises = sorted
            .filter(g => !isProgressQuiz(g.title) && !isChapterReview(g.title))
            .sort(sortTitleZA);

        return {
            main: [...progressQuiz, ...chapterReview, ...exercises],
            unsorted: unsorted.sort(sortTitleZA)
        };
    }

    function discoverChapters(rawData) {
        const set = new Set();
        rawData.forEach(item => {
            getChapterNumbers(item).forEach(n => set.add(n));
        });
        return [...set].sort((a, b) => a - b);
    }

    /** Whether a grouped item counts as unsorted (global, not per-chapter). */
    function isUnsortedGroup(group) {
        const title = group.title;
        if (hasYear10(title)) return true;
        if (isProgressQuiz(title) || isChapterReview(title) || isStandardExercise(title)) {
            return false;
        }
        return getChapterNumbers(group).length > 0;
    }

    function getAllUnsorted(rawData) {
        return groupData(rawData).filter(isUnsortedGroup).sort(sortTitleZA);
    }

    const CHAPTER_HUES = [220, 168, 280, 32, 340, 192, 48, 305, 130, 15];

    function getChapterAccent(chapterNum) {
        const h = CHAPTER_HUES[(Math.max(1, chapterNum) - 1) % CHAPTER_HUES.length];
        return {
            css: `hsl(${h} 62% 46%)`,
            cssHover: `hsl(${h} 62% 38%)`,
            ring: `hsla(${h}, 62%, 46%, 0.45)`
        };
    }

    function getSiteStats(rawData) {
        const grouped = groupData(rawData);
        const chapters = discoverChapters(rawData);
        const unsorted = getAllUnsorted(rawData);
        const sheetCount = rawData.length;
        return {
            sheets: sheetCount,
            exercises: grouped.length,
            chapters: chapters.length,
            unsorted: unsorted.length
        };
    }

    global.HomeworkUtils = {
        stripHalfLessonPrefix,
        getChapterNumbers,
        belongsToChapter,
        groupData,
        sortChapterHomework,
        discoverChapters,
        getAllUnsorted,
        getChapterAccent,
        getSiteStats,
        isUnsortedGroup,
        isProgressQuiz,
        isChapterReview,
        isStandardExercise,
        hasYear10
    };
})(typeof window !== 'undefined' ? window : global);
