(function () {
    'use strict';

    var STATUS = {
        new: 'Начинающие',
        progress: 'В процессе',
        final: 'Финальные',
        done: 'Законченные'
    };

    var team = [
        { name: 'Ким Сон', role: 'Разработчик', color: '#7700ff', action: 'обновил прогресс', ago: '5 минут назад' },
        { name: 'Иван Ордович', role: 'Дизайнер и разработчик', color: '#ff4f12', action: 'загрузил макеты', ago: '12 минут назад' },
        { name: 'Константин Сонин', role: 'Тестировщик', color: '#12b76a', action: 'закрыл 3 задачи', ago: '40 минут назад' },
        { name: 'Ольга Орк', role: 'Разработчик', color: '#2e90fa', action: 'оставила комментарий', ago: '1 час назад' },
        { name: 'Александр Ление', role: 'Разработчик', color: '#f79009', action: 'создал ветку релиза', ago: '2 часа назад' }
    ];

    var seed = [
        { name: 'Сервис печати', client: 'Ростелеком', progress: 30, days: 3, messages: 12, status: 'progress', team: [0, 1, 3] },
        { name: 'Медиаплатформа', client: 'Миранда-медиа, Крым', progress: 50, days: 5, messages: 8, status: 'progress', team: [1, 4] },
        { name: 'Мониторинг качества Wi-Fi сети', client: 'Администрация Тулы', progress: 10, days: 21, messages: 3, status: 'new', team: [0, 2] },
        { name: 'Мониторинг беспроводных сетей', client: 'Ростелеком', progress: 70, days: 9, messages: 17, status: 'progress', team: [0, 2, 3, 4] },
        { name: 'Сопряжение СКИТ со средствами измерения', client: 'Ростелеком', progress: 45, days: 12, messages: 6, status: 'progress', team: [3, 4] },
        { name: 'Портал госуслуг региона', client: 'ДИТ Ханты-Мансийского АО', progress: 55, days: 5, messages: 21, status: 'progress', team: [1, 2] },
        { name: 'Сервис «Мои документы»', client: 'МФЦ Ямало-Ненецкого АО', progress: 90, days: 1, messages: 30, status: 'final', team: [0, 1, 2] },
        { name: 'Wi-Fi в отделениях', client: 'Сбербанк, ЦФО', progress: 85, days: 3, messages: 14, status: 'final', team: [2, 4] },
        { name: 'Видеонаблюдение «Безопасный город»', client: 'Ростелеком', progress: 100, days: 0, messages: 42, status: 'done', team: [0, 3] },
        { name: 'Цифровая школа', client: 'Минобрнауки', progress: 5, days: 30, messages: 1, status: 'new', team: [1] }
    ];

    var STORAGE_KEY = 'rt-dashboard-projects';
    var state = { status: 'all', query: '', view: 'grid', projects: load() };

    var $list = document.getElementById('project-list');
    var $empty = document.getElementById('empty');
    var $filters = document.getElementById('filters');
    var $search = document.getElementById('search');
    var $dialog = document.getElementById('create-dialog');
    var $form = document.getElementById('create-form');

    function load() {
        try {
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved)) return saved;
        } catch (e) { /* localStorage недоступен */ }
        return seed.slice();
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
        } catch (e) { /* localStorage недоступен */ }
    }

    function plural(n, forms) {
        var n10 = n % 10, n100 = n % 100;
        if (n10 === 1 && n100 !== 11) return forms[0];
        if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
        return forms[2];
    }

    function deadline(p) {
        if (p.status === 'done') return '<span class="chip done">Завершён</span>';
        var text = p.days + ' ' + plural(p.days, ['день', 'дня', 'дней']) + ' ' + plural(p.days, ['остался', 'осталось', 'осталось']);
        return '<span class="chip' + (p.days <= 3 ? ' urgent' : '') + '">' + text + '</span>';
    }

    function initials(name) {
        return name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2);
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function card(p) {
        var members = p.team.map(function (i) {
            var m = team[i];
            return '<span style="background:' + m.color + '" title="' + m.name + '">' + initials(m.name) + '</span>';
        }).join('');

        return '<li class="project">' +
            '<div class="project-head">' +
                '<div class="project-icon"><img src="icons/' + (p.status === 'done' ? 'orange' : 'blue') + '.png" alt=""></div>' +
                '<div><p class="project-name">' + escapeHtml(p.name) + '</p>' +
                '<p class="project-client">' + escapeHtml(p.client) + '</p></div>' +
            '</div>' +
            '<div>' +
                '<div class="progress-label"><span>Прогресс</span><b>' + p.progress + '%</b></div>' +
                '<div class="progress"><span style="width:' + p.progress + '%"></span></div>' +
            '</div>' +
            '<div class="project-foot">' +
                '<div class="team">' + members + '</div>' +
                '<span class="messages" title="' + p.messages + ' ' + plural(p.messages, ['сообщение', 'сообщения', 'сообщений']) + '"><img src="icons/mess.png" alt="">' + p.messages + '</span>' +
                deadline(p) +
            '</div>' +
        '</li>';
    }

    function visible() {
        var q = state.query.trim().toLowerCase();
        return state.projects.filter(function (p) {
            var byStatus = state.status === 'all' || p.status === state.status;
            var byQuery = !q || (p.name + ' ' + p.client).toLowerCase().indexOf(q) !== -1;
            return byStatus && byQuery;
        });
    }

    function renderProjects() {
        var items = visible();
        $list.className = 'project-list ' + state.view;
        $list.innerHTML = items.map(card).join('');
        $empty.hidden = items.length > 0;
    }

    function renderFilters() {
        var counts = { all: state.projects.length };
        state.projects.forEach(function (p) { counts[p.status] = (counts[p.status] || 0) + 1; });
        Array.prototype.forEach.call($filters.children, function (btn) {
            var s = btn.dataset.status;
            btn.classList.toggle('active', s === state.status);
            btn.innerHTML = (s === 'all' ? 'Все' : STATUS[s]) + '<span class="count">' + (counts[s] || 0) + '</span>';
        });
    }

    function renderStats() {
        var total = state.projects.length;
        var done = state.projects.filter(function (p) { return p.status === 'done'; }).length;
        var inWork = state.projects.filter(function (p) { return p.status === 'progress'; }).length;
        var avg = total ? Math.round(state.projects.reduce(function (s, p) { return s + p.progress; }, 0) / total) : 0;
        document.getElementById('stats').innerHTML = [
            [total, 'Всего проектов'],
            [inWork, 'В процессе'],
            [total - done, 'Незавершённые'],
            [avg + '%', 'Средний прогресс']
        ].map(function (s) {
            return '<div class="stat"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>';
        }).join('');
    }

    function renderActivity() {
        document.getElementById('today').textContent = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        document.getElementById('activity').innerHTML = team.map(function (m) {
            return '<li><span class="avatar" style="background:' + m.color + '">' + initials(m.name) + '</span>' +
                '<div><div class="activity-name">' + m.name + '</div>' +
                '<div class="activity-meta">' + m.role + ' · ' + m.action + ' · ' + m.ago + '</div></div></li>';
        }).join('');
    }

    function render() {
        renderFilters();
        renderProjects();
        renderStats();
    }

    $filters.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter');
        if (!btn) return;
        state.status = btn.dataset.status;
        render();
    });

    $search.addEventListener('input', function () {
        state.query = $search.value;
        renderProjects();
    });

    document.querySelectorAll('[data-view]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            state.view = btn.dataset.view;
            document.querySelectorAll('[data-view]').forEach(function (b) { b.classList.toggle('active', b === btn); });
            renderProjects();
        });
    });

    document.getElementById('create-btn').addEventListener('click', function () {
        $form.reset();
        $dialog.showModal();
    });

    document.getElementById('cancel-btn').addEventListener('click', function () {
        $dialog.close();
    });

    $form.addEventListener('submit', function () {
        var data = new FormData($form);
        state.projects.unshift({
            name: data.get('name'),
            client: 'Ростелеком',
            progress: 0,
            days: Number(data.get('days')),
            messages: 0,
            status: 'new',
            team: [0]
        });
        save();
        state.status = 'all';
        render();
    });

    renderActivity();
    render();
})();
