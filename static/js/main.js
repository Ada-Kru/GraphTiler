//const ALARM_URL = 'http://192.168.2.114:5969/ALARM';
const APP_TITLE = 'HIT Split';
const DEFAULT_TITLE_WIDTH = 60;
const DEFAULT_MIN_HITS = 10;
const DEFAULT_ALARM_WINDOW_START = '21:15';
const DEFAULT_ALARM_WINDOW_END = '08:15';
const HS_URL_PREFIX = 'https://192.168.2.111:5000';
const IGNORE_SHORT_MOUSE_MOVES_PX = 10;

const MONITORING_MODES = {
    UNMONITORED: 0,
    PASSIVE: 1,
    COLOR_ONLY: 2
};

const MENU_TOGGLES = {
    ALWAYS: 0,
    SINGLE_ALWAYS: 1,
    NEVER: 2,
    MONITORED: 3,
    UNMONITORED: 4
};

class childPanel {
    constructor(config) {
        this.tables = [];
        let defaultConfig = {
            theme:       {
                bgPanel: '#333',
                bgContent: '#222',
                colorHeader: '#FFF',
                colorContent: '#FFF',
                border: '1px solid #444'
            },
            boxShadow: 0,
            headerControls: {
                smallify: 'remove',
                minimize: 'remove'
            },
            position:    'center-top 0 58',
            contentSize: {
                width: Math.floor(window.innerWidth / 1.5),
                height: Math.floor(window.innerHeight / 1.5)
            },
            onwindowresize: true,
            maximizedMargin: 0,
            syncMargins: true,
            iconfont: ['custom-smallify', 'custom-unsmallify', 'custom-minimize',  'custom-normalize', 'custom-maximize',  'custom-close'],
            content: '',
            resizeit: {
                resize: (panel, size, event) => this.onResize(panel, size, event)
            },
            onmaximized: (panel, status) => this.onResize(panel, status, null),
            onnormalized: (panel, status) => this.onResize(panel, status, null),
            callback: (panel) => this.setupContent(panel, arguments),
            onbeforeclose: (panel, status) => this.destroyContent(panel, status),
            onClose: () => this.deletePanel()
        };
        this.makePanel(Object.assign({}, defaultConfig, config));
    }

    setupContent(panel) {
        console.log('setupContent called');
    }

    makePanel(cfg) {
        this.panel = jsPanel.create(cfg);
    }

    onResize(panel, _size, _event) {
        for (let tbl of this.tables) {
            tbl.redraw();
        }
    }

    destroyContent(panel, status) {
        while (this.tables.length) {
            let tbl = this.tables.pop();
            tbl.clearData();
            tbl.destroy();
        }
        if (this.menuId) {
            ContextMenu.delete(this.menuId);
        }
        return true;
    }

    deletePanel() {
        this.panel = undefined;
    }

}


class MonitoringPanel extends childPanel {
    constructor(openMeID) {

        super({
            headerTitle: 'Monitoring',
            id: 'monitoringPanel',
            contentSize: {
                width: Math.floor(window.innerWidth / 1.5),
                height: Math.floor(window.innerHeight / 1.25)
            },
        });
        this.selectedRows = [];
        this.menuItems = [
            {
                text: 'Edit',
                disabled: false,
                action: () => this.onEdit(this.selectedRows[0].getData())
            },
            { isDivider: true },
            {
                text: 'Add',
                disabled: false,
                action: () => this.onAdd()
            },
            { isDivider: true },
            {
                text: 'Delete',
                disabled: false,
                subMenu: [{
                    text: 'Confirm',
                    disabled: false,
                    action: () => this.onDelete()
                }]
            },
        ];
        this.dataSelectors = {
            default_alarm_window_start: 'input[name="default_alarm_window_start"]',
            default_alarm_window_end: 'input[name="default_alarm_window_end"]',
            title_highlight: 'textarea[name="title_highlight"]',
            description_highlight: 'textarea[name="description_highlight"]'
        };
        this.openMeID = openMeID;
    }

    setupContent(panel) {
        panel.content.innerHTML = `<div class="contentHolder">
        <div id="monitoringTable" class="tableHolder">Monitoring table goes here.</div>
        <div class="inputRow">
        <span class="inputLable">Default Alarm Window:</span>
        <input name="default_alarm_window_start" type="time">
        <span></span>
        <input name="default_alarm_window_end" type="time">
        </div>
        <div class="inputRow">
        <span class="inputLable">Title Highlighting:</span>
        <textarea name="title_highlight" type="text" spellcheck="false"></textarea>
        </div>
        <div class="inputRow">
        <span class="inputLable">Description Highlighting:</span>
        <textarea name="description_highlight" type="text" spellcheck="false"></textarea>
        </div>
        <div class="inputRow">
        <button id="saveVariables" class="mainWinButton">Save Variables</button>
        <button id="closeMonitoring" class="mainWinButton">Close</button>
        </div>
        </div>`;

        this.table = new Tabulator(panel.content.querySelector('div.tableHolder'), {
            height:'100%',
            virtualDom:true,
            layout:'fitColumns',
            selectable: true,
            selectableRangeMode: 'click',
            columns: [
                {title:'ID', field:'id', sorter:'string', width: 120, minWidth: 120, headerSortTristate:true},
                {title:'Requester', field:'requester', sorter:'string', minWidth: 200, headerSortTristate:true},
                {title:'Last Seen', field:'last_seen', sorter:'datetime', sorterParams:{ format:'MM-DD-YYYY'}, width: 120, minWidth: 120, headerSortTristate:true},
                {title:'Attributes', formatter: this.formatAttributes, sorter:'string', width: 80, headerSortTristate:true}
            ],
            initialSort:[{column:'requester', dir:'asc'}],
            rowMouseEnter: (evt, row) => { this.hoveredRow = row; },
            rowMouseLeave: (evt, row) => { this.hoveredRow = null; }
        });

        this.tables.push(this.table);
        this.menuId = '#monitoringTable';
        ContextMenu.attach(this.menuId, this.menuItems, (menu, evt) => this.showTableContextMenu(menu, evt));
        document.getElementById('saveVariables').onclick = ()=> this.onSave();
        document.getElementById('closeMonitoring').onclick = ()=> panel.close();
        this.updateData();
    }

    async updateData(replace=false) {
        let data = await (await fetch('/monitored/')).json();
        if (!replace) {
            this.table.setData(data.monitored);
        }
        else {
            await this.table.replaceData(data.monitored);
        }
        this.panel.content.querySelector('input[name="default_alarm_window_start"]').value = data.default_alarm_window_start;
        this.panel.content.querySelector('input[name="default_alarm_window_end"]').value = data.default_alarm_window_end;
        this.panel.content.querySelector('textarea[name="title_highlight"]').value = data.title_highlight;
        this.panel.content.querySelector('textarea[name="description_highlight"]').value = data.description_highlight;
        this.panel.setHeaderTitle(`Monitoring (${data.monitored.length} entries)`);
        this.table.redraw();
        if (this.openMeID) {
            this.onEdit(this.table.searchData('id', '=', this.openMeID)[0]);
            this.openMeID = null;
        }
    }

    formatAttributes(cell, formatterParams, onRendered) {
        let data = cell.getRow().getData();
        let attributes = '';
        if (data.alarms.length) {
            attributes += data.external_alarm_enabled ? '⏰' : '🕰️';
        }
        if (data.monitoring_type === MONITORING_MODES.COLOR_ONLY) {
            attributes += '🎨';
        }
        if (data.title_match || data.description_match) {
            attributes += '➕';
        }
        if (data.title_exclude || data.description_exclude) {
            attributes += '➖';
        }
        return attributes;
    }

    showTableContextMenu(menu, event) {
        let selected = this.table.getSelectedRows();
        if (this.hoveredRow && selected.length < 2) {
            this.table.deselectRow();
            this.table.selectRow(this.hoveredRow);
            this.selectedRows = [this.hoveredRow];
            for (let item of this.menuItems) {
                item.disabled = false;
            }
        }
        else if (this.hoveredRow) {
            this.selectedRows = selected;
            for (let item of this.menuItems) {
                item.disabled = item.text === 'Add' || item.text === 'Edit' ? true : false;
            }
        }
        else {
            this.table.deselectRow();
            for (let item of this.menuItems) {
                item.disabled = item.text !== 'Add';
            }
        }
        return this.menuItems;
    }

    onEdit(data) {
        this.showEditMonitoring('Edit Monitoring', data);
    }

    onAdd() {
        this.showEditMonitoring('Add Monitoring');
    }

    async onDelete() {
        let ids = [];
        for (let row of this.selectedRows) {
            ids.push(row.getData().id);
        }

        await fetch('/delete/monitored/', {
            method: 'POST',
            body: JSON.stringify(ids),
            headers:{ 'Content-Type': 'application/json' }
        });
        this.updateData();
    }

    showEditMonitoring(title, data) {
        if (document.getElementById('editMonitoringPanel')) {
            return;
        }
        new EditMonitoringPanel(title, this, data);
    }

    async onSave() {
        let regexes = {};
        for (let key of Object.keys(this.dataSelectors)) {
            let input = this.panel.content.querySelector(this.dataSelectors[key]);
            input.setCustomValidity('');
            regexes[key] = input.value;
        }
        let errors = await this.saveRegexes(regexes);
        if (Object.keys(errors).length === 0) {
            this.panel.close();
        }
        else {
            this.showErrors(errors);
        }
    }

    async saveRegexes(data) {
        return await (await fetch('/variables/', {
            method: 'POST',
            body: JSON.stringify(data),
            headers:{ 'Content-Type': 'application/json' }
        })).json();
    }

    showErrors(errors) {
        for (let key of Object.keys(errors)) {
            let input = this.panel.content.querySelector(this.dataSelectors[key]);
            input.setCustomValidity(errors[key]);
            input.reportValidity(errors[key]);
        }
    }
}


class EditMonitoringPanel extends childPanel {
    constructor(title, parent, requester) {
        super({
            headerTitle: title,
            id: 'editMonitoringPanel',
            closeOnBackdrop: false,
        });
        if (requester) {
            this.requester = requester;
            this.fillInputs(this.panel, requester);
        }
        this.parent = parent;
    }

    makePanel(cfg) {
        this.panel = jsPanel.modal.create(cfg);
    }

    setupContent(panel) {
        panel.content.innerHTML = `<div class="contentHolder">
        <div class="panelInputs">
        <div class="inputRow">
        <span class="inputLable">Name:</span><input class="shorter" name="requester" type="text">
        </div>
        <div class="inputRow">
        <span class="inputLable">ID:</span><input class="shorter" name="id" type="text">
        </div>
        <div class="inputRow">
        <span class="inputLable">Min Hits:</span><input class="veryShort" name="min_hits" type="number" min="0" size="5" value="${DEFAULT_MIN_HITS}">
        </div>
        <div class="inputRow">
        <span class="inputLable">Title Match:</span><input name="title_match" type="text">
        </div>
        <div class="inputRow">
        <span class="inputLable">Title Exclude:</span><input name="title_exclude" type="text">
        </div>
        <div class="inputRow">
        <span class="inputLable">Description Match:</span><input name="description_match" type="text">
        </div>
        <div class="inputRow">
        <span class="inputLable">Description Exclude:</span><input name="description_exclude" type="text">
        </div>
        <div class="inputRow">
        <label for="alarmsEnabledCheckbox"><input name="external_alarm_enabled" id="alarmsEnabledCheckbox" checked="checked" type="checkbox"> Enable Alarms</label>
        <div class="inputGroup">
        <label for="passiveRadio"><input name="monitoring_type" id="passiveRadio" value="${MONITORING_MODES.PASSIVE}" checked="checked" type="radio"> Passive</label>
        <label for="colorOnlyRadio"><input name="monitoring_type" id="colorOnlyRadio" value="${MONITORING_MODES.COLOR_ONLY}" type="radio"> Colorize Only</label>
        </div>
        </div>
        </div>
        <div id="alarmTable" class="tableHolder">Alarm table goes here.</div>
        <div class="inputRow">
        <button id="editMonitoringSave" class="mainWinButton">Save</button>
        <button id="editMonitoringCancel" class="mainWinButton">Cancel</button>
        </div>`;

        document.getElementById('editMonitoringSave').onclick = () => this.onSave();
        document.getElementById('editMonitoringCancel').onclick = () => panel.close();

        this.dataSelectors = {
            requester: 'input[name="requester"]',
            id: 'input[name="id"]',
            min_hits: 'input[name="min_hits"]',
            title_match: 'input[name="title_match"]',
            title_exclude: 'input[name="title_exclude"]',
            description_match: 'input[name="description_match"]',
            description_exclude: 'input[name="description_exclude"]'
        };

        this.table = new Tabulator(panel.content.querySelector('div.tableHolder'), {
            index: 'alarm_id',
            data: [],
            layout:'fitColumns',
            selectable: true,
            selectableRangeMode: 'click',
            columns: [
                {title:'Title Match', field:'title_match', sorter:'string', minWidth: 200, headerSortTristate:true},
                {title:'Description Match', field:'description_match', sorter:'string', minWidth: 200, headerSortTristate:true},
                {title:'Between', field:'alarm_window_start', formatter: this.formatAlarmWindow ,sorter:'string', width: 120, minWidth: 120, headerSortTristate:true},
                {title:'Minimum HITs', field:'min_hits', sorter:'string', width: 100, headerSortTristate:true},
                {title:'Pay', field:'pay', formatter:this.formatAlarmPay, sorter:'string', width: 80, headerSortTristate:true}
            ],
            rowMouseEnter: (evt, row) => { this.hoveredRow = row; },
            rowMouseLeave: (evt, row) => { this.hoveredRow = null; }
        });

        this.tables.push(this.table);

        this.menuItems = [
            {
                text: 'Edit',
                disabled: false,
                action: () => this.onEdit(this)
            },
            { isDivider: true },
            {
                text: 'Add',
                disabled: false,
                action: () => this.onAdd(this)
            },
            { isDivider: true },
            {
                text: 'Delete',
                disabled: false,
                action: () => this.onDelete(this)
            },
        ];
        this.menuId = '#alarmTable';
        ContextMenu.attach(this.menuId, this.menuItems, (menu, evt) => this.showTableContextMenu(menu, evt));
    }

    fillInputs(panel, data) {
        for (let key of Object.keys(this.dataSelectors)) {
            panel.querySelector(this.dataSelectors[key]).value = data[key];
        }
        panel.querySelector(`input[name="id"]`).disabled = true;
        panel.querySelector(`input[name="monitoring_type"][value="${data.monitoring_type}"]`).click();
        panel.querySelector(`input[name="external_alarm_enabled"]`).checked = data.external_alarm_enabled ? 'checked' : null;
        this.table.setData(data.alarms);
    }

    formatAlarmWindow(cell, formatterParams, onRendered) {
        let data = cell.getRow().getData();
        return data.use_default_alarm_window ? 'Default' : data.alarm_window_start + ' - ' + data.alarm_window_end;
    }

    formatAlarmPay(cell, formatterParams, onRendered) {
        let data = cell.getRow().getData();
        return data.operator + ' $' + data.pay;
    }

    showTableContextMenu(menu, event) {
        let selected = this.table.getSelectedRows();
        if (this.hoveredRow && selected.length < 2) {
            this.table.deselectRow();
            this.table.selectRow(this.hoveredRow);
            this.selectedRows = [this.hoveredRow];
            for (let item of this.menuItems) {
                item.disabled = false;
            }
        }
        else if (this.hoveredRow) {
            this.selectedRows = selected;
            for (let item of this.menuItems) {
                item.disabled = item.text === 'Add' || item.text === 'Edit' ? true : false;
            }
        }
        else {
            this.table.deselectRow();
            for (let item of this.menuItems) {
                item.disabled = item.text !== 'Add';
            }
        }
        return this.menuItems;
    }

    onEdit() {
        let rowdata = this.selectedRows[0].getData();
        this.showEditAlarm('Edit Alarm', rowdata, rowdata.alarm_id);
    }

    onAdd() {
        this.showEditAlarm('Add Alarm', undefined, uuidv4());
    }

    onDelete() {
        for (let row of this.selectedRows) {
            row.delete();
        }
    }

    showEditAlarm(title, data, alarmId) {
        if (document.getElementById('editAlarmPanel')) {
            return;
        }
        new EditAlarmPanel(title, this, data, alarmId);
    }

    addAlarm(alarm, alarmId) {
        this.table.updateOrAddData([alarm], alarmId).then((rows) => {
            for (let row of rows) {
                row.reformat();
            }
        });
    }

    async onSave() {
        let data = this.serializeInputs();
        if (data === false) {
            return;
        }
        let errors = await this.saveMonitored(data);
        if (Object.keys(errors).length === 0) {
            this.panel.close();
        }
        else {
            this.showErrors(errors);
        }
    }

    destroyContent(panel, status) {
        while (this.tables.length) {
            let tbl = this.tables.pop();
            tbl.destroy();
        }
        if (this.menuId) {
            ContextMenu.delete(this.menuId);
        }
        this.parent.updateData(true);
        return true;
    }

    serializeInputs() {
        let data = {};
        for (let key of Object.keys(this.dataSelectors)) {
            let input = this.panel.content.querySelector(this.dataSelectors[key]);
            input.setCustomValidity('');
            if (!input.checkValidity()) {
                return false;
            }
            data[key] = input.value;
        }
        data.monitoring_type = this.panel.querySelector('input[name="monitoring_type"]:checked').value;
        data.external_alarm_enabled = this.panel.querySelector('input[name="external_alarm_enabled"]').checked;
        if (this.requester) {
            data.last_seen = this.requester.last_seen;
        }
        data.alarms = this.table.getData();
        return data;
    }

    async saveMonitored(data) {
        return await (await fetch('/monitored/', {
            method: 'POST',
            body: JSON.stringify(data),
            headers:{ 'Content-Type': 'application/json' }
        })).json();
    }

    showErrors(errors) {
        for (let key of Object.keys(errors)) {
            let input = this.panel.content.querySelector(this.dataSelectors[key]);
            input.setCustomValidity(errors[key]);
            input.reportValidity(errors[key]);
        }
    }

}


class EditAlarmPanel extends childPanel {
    constructor(title, parent, alarm, alarm_id) {
        super({
            headerTitle: title,
            id: 'editAlarmPanel',
            closeOnBackdrop: false,
            boxShadow: 5,
            container: parent.panel.content,
            panelSize: {
                width: Math.floor(window.innerWidth / 2),
                height: 'auto'
            },
            position: {
                my: 'center-bottom',
                at: 'center',
                of: parent.panel.content
            }
        });
        this.parent = parent;
        this.dataSelectors = {
            title_match: 'input[name="title_match"]',
            description_match: 'input[name="description_match"]',
            min_hits: 'input[name="min_hits"]',
            operator: 'select[name="operator"]',
            pay: 'input[name="pay"]',
            use_default_alarm_window: 'input[name="use_default_alarm_window"]',
            alarm_window_start: 'input[name="alarm_window_start"]',
            alarm_window_end: 'input[name="alarm_window_end"]'
        };
        if (alarm) {
            this.fillInputs(this.panel, alarm);
        }
        if (alarm_id !== undefined) {
            this.alarm_id = alarm_id;
        }
    }

    makePanel(cfg) {
        this.panel = jsPanel.modal.create(cfg);
    }

    setupContent(panel) {
        panel.content.innerHTML = `<div class="contentHolder">
        <div class="panelInputs">
        <div class="inputRow">
        <span class="inputLable">Title Match:</span><input name="title_match" type="text">
        </div>
        <div class="inputRow">
        <span class="inputLable">Description Match:</span><input name="description_match" type="text">
        </div>
        <div class="inputRow">
        <span class="inputLable">Minimum Hits:</span><input class="veryShort" name="min_hits" type="number" min="0" size="5" value="${DEFAULT_MIN_HITS}">
        </div>
        <div class="inputRow">
        <span class="inputLable">If pay is:</span>
        <select class="veryShort" name="operator" type="text">
        <option value=">="selected>&gt;=</option>
        <option value="=">=</option>
        <option value="<=">&lt;=</option>
        </select>
        <input name="pay" class="veryShort" type="number" step="0.01" value="0.01">
        </div>
        <div class="inputRow">
        <label for="useDefaultAlarmCheckbox">
        <input id="useDefaultAlarmCheckbox" name="use_default_alarm_window" type="checkbox" checked>
        Use default alarm window
        </label>
        </div>
        <div id="alarmTimeInputs" class="inputRow" style="display: none;">
        <span class="inputLable">Between:</span>
        <input id="alarmWindowStartInput" name="alarm_window_start" value="${DEFAULT_ALARM_WINDOW_START}" type="time">
        <span></span>
        <input id="alarmWindowEndInput" name="alarm_window_end" value="${DEFAULT_ALARM_WINDOW_END}" type="time">
        </div>
        <div class="inputRow">
        <button id="editAlarmOk" class="mainWinButton">OK</button>
        <button id="editAlarmCancel" class="mainWinButton">Cancel</button>
        </div>
        </div>`;

        document.getElementById('editAlarmOk').onclick = () => this.onSave();
        document.getElementById('editAlarmCancel').onclick = () => panel.close();
        document.getElementById('useDefaultAlarmCheckbox').onclick = () => this.setAlarmInputStates();
    }

    fillInputs(panel, data) {
        for (let key of Object.keys(this.dataSelectors)) {
            let input = panel.querySelector(this.dataSelectors[key]);
            if (input.type !== 'checkbox') {
                input.value = data[key];
            }
            else {
                input.checked = data[key];
            }
        }
        this.setAlarmInputStates();
    }

    setAlarmInputStates() {
        let alarmState = document.getElementById('useDefaultAlarmCheckbox').checked;
        document.getElementById('alarmTimeInputs').style = alarmState ? 'display: none;' : '';
    }

    async onSave() {
        let alarmData = this.serializeInputs();
        if (alarmData === false) {
            return;
        }
        let errors = await this.validateAlarmData(alarmData);
        if (Object.keys(errors).length === 0) {
            this.parent.addAlarm(alarmData, this.alarm_id);
            this.panel.close();
        }
        else {
            this.showErrors(errors);
        }
    }

    serializeInputs() {
        let data = {alarm_id: this.alarm_id};
        for (let key of Object.keys(this.dataSelectors)) {
            let input = this.panel.content.querySelector(this.dataSelectors[key]);
            input.setCustomValidity('');
            if (!input.checkValidity()) {
                return false;
            }
            if (input.type !== 'checkbox') {
                data[key] = input.value;
            }
            else {
                data[key] = input.checked;
            }
        }
        return data;
    }

    async validateAlarmData(alarmData) {
        return await (await fetch('/validate/alarm/', {
            method: 'POST',
            body: JSON.stringify(alarmData),
            headers:{ 'Content-Type': 'application/json' }
        })).json();
    }

    showErrors(errors) {
        for (let key of Object.keys(errors)) {
            let input = this.panel.content.querySelector(this.dataSelectors[key]);
            input.setCustomValidity(errors[key]);
            input.reportValidity(errors[key]);
        }
    }

}


class BlockingPanel extends childPanel {
    constructor(requesterId=null, requester=null) {

        super({
            headerTitle: 'Blocking',
            id: 'blockingPanel',
            contentSize: {
                width: Math.floor(window.innerWidth / 1.5),
                height: Math.floor(window.innerHeight / 1.25)
            },
        });
        if (requesterId) {
            this.requesterId = requesterId;
            this.requester = requester;
        }
        this.selectedRows = [];
        this.menuItems = [
            {
                text: 'Edit',
                disabled: false,
                action: () => this.onEdit()
            },
            { isDivider: true },
            {
                text: 'Add',
                disabled: false,
                action: () => this.onAdd()
            },
            { isDivider: true },
            {
                text: 'Delete',
                disabled: false,
                subMenu: [{
                    text: 'Confirm',
                    disabled: false,
                    action: () => this.onDelete()
                }]
            }
        ];
        this.dataSelectors = {
            title_blocking: 'textarea[name="title_blocking"]',
            description_blocking: 'textarea[name="description_blocking"]'
        };

    }

    setupContent(panel) {
        panel.content.innerHTML = `<div class="contentHolder">
        <div id="blockingTable" class="tableHolder">Blocking table goes here.</div>
        <div class="inputRow">
        <span class="inputLable">Title Blocking:</span>
        <textarea name="title_blocking" type="text" spellcheck="false"></textarea>
        </div>
        <div class="inputRow">
        <span class="inputLable">Description Blocking:</span>
        <textarea name="description_blocking" type="text" spellcheck="false"></textarea>
        </div>
        <div class="inputRow">
        <button id="saveBlockingRegexes" class="mainWinButton">Save Regexes</button>
        <button id="closeBlocking" class="mainWinButton">Close</button>
        </div>
        </div>`;

        document.getElementById('saveBlockingRegexes').onclick = ()=> this.onSave();
        document.getElementById('closeBlocking').onclick = ()=> panel.close();

        this.table = new Tabulator(panel.content.querySelector('div.tableHolder'), {
            layout:'fitColumns',
            selectable: true,
            selectableRangeMode: 'click',
            columns: [
                {title:'ID', field:'id', sorter:'string', width: 120, minWidth: 120, headerSortTristate:true},
                {title:'Requester', field:'requester', sorter:'string', minWidth: 200, headerSortTristate:true},
                {title:'Last Seen', field:'last_seen', sorter:'time', sorterParams:{ format:'MM-DD-YYYY'}, width: 120, minWidth: 120, headerSortTristate:true},
                {title:'Attributes', formatter: this.formatAttributes, sorter:'string', width: 80, headerSortTristate:true}
            ],
            initialSort:[{column:'requester', dir:'asc'}],
            rowMouseEnter: (evt, row) => { this.hoveredRow = row; },
            rowMouseLeave: (evt, row) => { this.hoveredRow = null; },
        });

        this.tables.push(this.table);
        this.menuId = '#blockingTable';
        ContextMenu.attach(this.menuId, this.menuItems, (menu, evt) => this.showTableContextMenu(menu, evt));
        this.updateData();
    }

    async updateData() {
        let data = await (await fetch('/blocked/')).json();
        this.table.setData( data.blocked );
        this.panel.content.querySelector('textarea[name="title_blocking"]').value = data.title_blocking;
        this.panel.content.querySelector('textarea[name="description_blocking"]').value = data.description_blocking;
        this.panel.setHeaderTitle(`Blocking (${data.blocked.length} entries)`);
        this.table.redraw();
        if (this.requesterId) {
            let data = this.table.searchData('id', '=', this.requesterId);
            if (data.length) {
                this.showEditBlocking('Edit Blocking', data[0]);
            }
            else {
                this.showEditBlocking('Add Blocking', {
                    id: this.requesterId,
                    requester: this.requester});
                }
                this.requesterId = null;
                this.requester = null;
            }
        }

        formatAttributes(cell, formatterParams, onRendered) {
            let data = cell.getRow().getData();
            let attributes = '';
            if (data.block_all) {
                attributes += '❌';
            }
            if (data.title_exclude !== null) {
                attributes += '📓';
            }
            if (data.description_exclude !== null) {
                attributes += '📜';
            }
            return attributes;
        }

        showTableContextMenu(menu, event) {
            let selected = this.table.getSelectedRows();
            if (this.hoveredRow && selected.length < 2) {
                this.table.deselectRow();
                this.table.selectRow(this.hoveredRow);
                this.selectedRows = [this.hoveredRow];
                for (let item of this.menuItems) {
                    item.disabled = false;
                }
            }
            else if (this.hoveredRow) {
                this.selectedRows = selected;
                for (let item of this.menuItems) {
                    item.disabled = item.text === 'Add' || item.text === 'Edit' ? true : false;
                }
            }
            else {
                this.table.deselectRow();
                for (let item of this.menuItems) {
                    item.disabled = item.text !== 'Add';
                }
            }
            return this.menuItems;
        }

        onEdit() {
            this.showEditBlocking('Edit Blocking', this.selectedRows[0].getData());
        }

        onAdd() {
            this.showEditBlocking('Add Blocking');
        }

        async onDelete() {
            let ids = [];
            for (let row of this.selectedRows) {
                ids.push(row.getData().id);
            }

            await fetch('/delete/blocked/', {
                method: 'POST',
                body: JSON.stringify(ids),
                headers:{ 'Content-Type': 'application/json' }
            });
            this.updateData();
        }


        showEditBlocking(title, data) {
            if (document.getElementById('editBlockingPanel')) {
                return;
            }
            new EditBlockingPanel(title, this, data);
        }

        async onSave() {
            let regexes = {};
            for (let key of Object.keys(this.dataSelectors)) {
                let input = this.panel.content.querySelector(this.dataSelectors[key]);
                input.setCustomValidity('');
                regexes[key] = input.value;
            }
            let errors = await this.saveRegexes(regexes);
            if (Object.keys(errors).length === 0) {
                this.panel.close();
            }
            else {
                this.showErrors(errors);
            }
        }

        async saveRegexes(data) {
            return await (await fetch(
                '/variables/',
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers:{ 'Content-Type': 'application/json' }
                })).json();
            }

            showErrors(errors) {
                for (let key of Object.keys(errors)) {
                    let input = this.panel.content.querySelector(this.dataSelectors[key]);
                    input.setCustomValidity(errors[key]);
                    input.reportValidity(errors[key]);
                }
            }
        }


        class EditBlockingPanel extends childPanel {
            constructor(title, parent, requester) {
                super({
                    headerTitle: title,
                    id: 'editBlockingPanel',
                    closeOnBackdrop: false,
                    boxShadow: 5,
                    container: parent.panel.content,
                    panelSize: {
                        width: Math.floor(window.innerWidth / 2),
                        height: 'auto'
                    },
                    position: {
                        my: 'center-bottom',
                        at: 'center',
                        of: parent.panel.content
                    }
                });
                this.parent = parent;
                this.dataSelectors = {
                    id: 'input[name="id"]',
                    requester: 'input[name="requester"]',
                    block_all: 'input[name="block_all"]',
                    title_exclude: 'input[name="title_exclude"]',
                    description_exclude: 'input[name="description_exclude"]'
                };
                if (requester) {
                    this.fillInputs(this.panel, requester);
                }
            }

            makePanel(cfg) {
                this.panel = jsPanel.modal.create(cfg);
            }

            setupContent(panel) {
                panel.content.innerHTML = `<div class="contentHolder">
                <div class="panelInputs">
                <div class="inputRow">
                <span class="inputLable">ID:</span><input class="shorter" name="id" type="text">
                </div>
                <div class="inputRow">
                <span class="inputLable">Name:</span><input class="shorter" name="requester" type="text">
                </div>
                <div class="inputRow left">
                <span></span><label for="blockAllCheckbox"><input id="blockAllCheckbox" class="veryShort" name="block_all" checked type="checkbox"> Block Everything</label>
                </div>
                <div id="blockExcludeInputs" style="display: none;">
                <div class="inputRow">
                <span class="inputLable">Title match:</span><input name="title_exclude" type="text">
                </div>
                <div class="inputRow">
                <span class="inputLable">Description match:</span><input name="description_exclude" type="text">
                </div>
                </div>
                <div class="inputRow">
                <button id="editBlockingSave" class="mainWinButton">Save</button>
                <button id="editBlockingCancel" class="mainWinButton">Cancel</button>
                </div>
                </div>`;

                document.getElementById('blockAllCheckbox').onclick = () => this.setExcludeInputStates();
                document.getElementById('editBlockingSave').onclick = () => this.onSave();
                document.getElementById('editBlockingCancel').onclick = () => panel.close();
            }

            fillInputs(panel, data) {
                for (let key of Object.keys(this.dataSelectors)) {
                    if (data.hasOwnProperty(key)) {
                        panel.querySelector(this.dataSelectors[key]).value = data[key];
                    }
                }
                if (data.hasOwnProperty('block_all')) {
                    panel.querySelector(`input[name="block_all"]`).checked = data.block_all === true ? 'checked' : null;
                }
                panel.querySelector(`input[name="id"]`).disabled = true;
                this.setExcludeInputStates();
            }

            setExcludeInputStates() {
                let blockState = document.getElementById('blockAllCheckbox').checked;
                document.getElementById('blockExcludeInputs').style = blockState ? 'display: none;' : '';
            }

            async onSave() {
                let blockingData = this.serializeInputs();
                if (blockingData === false) {
                    return;
                }
                let errors = await this.saveBlocked(blockingData);
                if (!Object.keys(errors).length) {
                    this.parent.updateData();
                    this.panel.close();
                }
                else {
                    this.showErrors(errors);
                }
            }

            serializeInputs() {
                let data = {};
                for (let key of Object.keys(this.dataSelectors)) {
                    let input = this.panel.querySelector(this.dataSelectors[key]);
                    input.setCustomValidity('');
                    if (!input.checkValidity()) {
                        return false;
                    }
                    data[key] = input.value;
                }
                data.block_all = this.panel.querySelector('input[name="block_all"]').checked;
                return data;
            }

            async saveBlocked(data) {
                return await (await fetch('/blocked/', {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers:{ 'Content-Type': 'application/json' }
                })).json();
            }

            showErrors(errors) {
                for (let key of Object.keys(errors)) {
                    let input = this.panel.content.querySelector(this.dataSelectors[key]);
                    input.setCustomValidity(errors[key]);
                    input.reportValidity(errors[key]);
                }
            }

        }

        class IgnoringPanel extends childPanel {
            constructor() {

                super({
                    headerTitle: 'Ignoring',
                    id: 'ignoringPanel',
                    contentSize: {
                        width: Math.floor(window.innerWidth / 1.05),
                        height: Math.floor(window.innerHeight / 1.25)
                    },
                });
                this.selectedRows = [];
                this.menuItems = [
                    {
                        text: 'Remove',
                        disabled: false,
                        action: () => this.onRemove()
                    },
                ];
                this.dataSelectors = {
                    title_ignoring: 'textarea[name="title_ignoring"]',
                    description_ignoring: 'textarea[name="description_ignoring"]'
                };

            }

            setupContent(panel) {
                panel.content.innerHTML = `<div class="contentHolder">
                <div id="ignoringTable" class="tableHolder">Blocking table goes here.</div>
                <div class="inputRow">
                <span class="inputLable">Title Ignoring:</span>
                <textarea name="title_ignoring" type="text" spellcheck="false"></textarea>
                </div>
                <div class="inputRow">
                <span class="inputLable">Description Ignoring:</span>
                <textarea name="description_ignoring" type="text" spellcheck="false"></textarea>
                </div>
                <div class="inputRow">
                <button id="saveIgnoringRegexes" class="mainWinButton">Save Regexes</button>
                <button id="closeIgnoring" class="mainWinButton">Close</button>
                </div>
                </div>`;

                document.getElementById('saveIgnoringRegexes').onclick = ()=> this.onSave();
                document.getElementById('closeIgnoring').onclick = ()=> panel.close();

                this.table = new Tabulator(panel.content.querySelector('div.tableHolder'), {
                    layout:'fitColumns',
                    selectable: true,
                    selectableRangeMode: 'click',
                    columns: [
                        {title:'ID', field:'id', sorter:'string', minWidth: 100, width: 100, headerSortTristate:true},
                        {title:'Requester', field:'requester', sorter:'string', minWidth: 100, width: 100, headerSortTristate:true},
                        {title:'Title', field: 'title', sorter:'string', minWidth: 200, headerSortTristate:true},
                        {title:'While HITs', field: 'hits_less_than', formatter: this.formatHitsNum, sorter:'string', minWidth: 80, width: 80, headerSortTristate:true},
                        {title:'Time Added', field: 'time_added', sorter:'time', sorterParams:{ format:'YYYY-MM-DDTHH:mm:ssZ'}, width: 180, headerSortTristate:true}
                    ],
                    initialSort:[{column:'time_added', dir:'desc'}],
                    rowMouseEnter: (evt, row) => { this.hoveredRow = row; },
                    rowMouseLeave: (evt, row) => { this.hoveredRow = null; },
                    rowFormatter: (row) => { row.getElement().setAttribute('tag', row.getData().tag); },
                    rowDblClick: (evt, row) => {
                        window.getSelection().removeAllRanges();
                        this.onOpenRequester(row.getData().id);
                    }
                });

                this.tables.push(this.table);
                this.menuId = '#ignoringTable';
                ContextMenu.attach(this.menuId, this.menuItems, (menu, evt) => this.showTableContextMenu(menu, evt));
                this.updateData();
            }

            formatHitsNum(cell, formatterParams, onRendered) {
                let data = cell.getRow().getData().while_hits;
                return data !== null ? '< ' + data : 'Any';
            }

            async updateData() {
                let data = await (await fetch('/ignored/')).json();
                this.table.setData( data.ignored );
                this.panel.content.querySelector('textarea[name="title_ignoring"]').value = data.title_ignoring;
                this.panel.content.querySelector('textarea[name="description_ignoring"]').value = data.description_ignoring;
                this.panel.setHeaderTitle(`Ignoring (${data.ignored.length} entries)`);
                this.table.redraw();
            }

            showTableContextMenu(menu, event) {
                let selected = this.table.getSelectedRows();
                if (this.hoveredRow && selected.length < 2) {
                    this.table.deselectRow();
                    this.table.selectRow(this.hoveredRow);
                    this.selectedRows = [this.hoveredRow];
                    for (let item of this.menuItems) {
                        item.disabled = false;
                    }
                }
                else if (this.hoveredRow) {
                    this.selectedRows = selected;
                    for (let item of this.menuItems) {
                        item.disabled = item.text !== 'Remove';
                    }
                }
                else {
                    this.table.deselectRow();
                    return [];
                }
                return this.menuItems;
            }

            async onRemove() {
                let ids = [];
                for (let row of this.selectedRows) {
                    ids.push(row.getData().group_id);
                }

                await fetch('/remove/ignored/', {
                    method: 'POST',
                    body: JSON.stringify(ids),
                    headers:{ 'Content-Type': 'application/json' }
                });
                this.updateData();
            }

            async onOpenRequester(requesterId) {
                await fetch('/open_page/requester', {
                    method: 'POST',
                    body: JSON.stringify({id: requesterId}),
                    headers:{ 'Content-Type': 'application/json' }
                });
                this.panel.close();
            }

            async onSave() {
                let regexes = {};
                for (let key of Object.keys(this.dataSelectors)) {
                    let input = this.panel.content.querySelector(this.dataSelectors[key]);
                    input.setCustomValidity('');
                    regexes[key] = input.value;
                }
                let errors = await this.saveRegexes(regexes);
                if (Object.keys(errors).length === 0) {
                    this.panel.close();
                }
                else {
                    this.showErrors(errors);
                }
            }

            async saveRegexes(data) {
                return await (await fetch('/variables/', {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers:{ 'Content-Type': 'application/json' }
                })).json();
            }

            showErrors(errors) {
                for (let key of Object.keys(errors)) {
                    let input = this.panel.content.querySelector(this.dataSelectors[key]);
                    input.setCustomValidity(errors[key]);
                    input.reportValidity(errors[key]);
                }
            }

        }


        class LogPanel extends childPanel {
            constructor() {
                super({
                    headerTitle: 'Log',
                    id: 'logPanel'
                });
            }

            setupContent(panel) {
                panel.content.innerHTML = `<div class='contentHolder'>
                <div class='tableHolder'>Log table goes here.</div>
                </div>`;

                this.table = new Tabulator(panel.content.querySelector('div.tableHolder'), {
                    height: '99.5%',
                    layout:'fitColumns',
                    columns: [
                        {title:'Time', field:'time', sorter:'datetime', sorterParams:{ format:'MM-DD-YYYY / hh:mm:ss'}, width: 150, minWidth: 120, headerSortTristate:true},
                        {title:'Type', field:'tag', sorter:'string', width: 150, minWidth: 120, headerSortTristate:true},
                        {title:'Message', field:'message', sorter:'string', minWidth: 150, headerSortTristate:true}
                    ],
                    rowFormatter: (row) => { row.getElement().setAttribute('tag', row.getData().tag); }
                });
                this.tables.push(this.table);
                this.getLogs();
            }

            async getLogs() {
                let logs = await (await fetch('/log/')).json();
                this.table.replaceData(logs);
                this.panel.setHeaderTitle(`Log (${logs.length} entries)`);
                this.table.redraw();
                let rows = this.table.getRows();
                if (rows.length) {
                    rows[rows.length - 1].scrollTo();
                }
            }
        }


        class HistoryPanel extends childPanel {
            constructor(app) {
                super({
                    headerTitle: 'History',
                    id: 'historyPanel'
                });
                this.app = app;
            }

            setupContent(panel) {
                panel.content.innerHTML = `<div class='contentHolder'>
                <div class='tableHolder'>History table goes here.</div>
                </div>`;

                this.table = new Tabulator(panel.content.querySelector('div.tableHolder'), {
                    layout:'fitColumns',
                    selectable: false,
                    columns: [
                        {title:'Requester', field:'requester', sorter:'string', width:200, headerSort:false},
                        {title:'Title', field:'title', sorter:'string', minWidth:200, headerSortTristate:true},
                        {title:'Count', field:'count', sorter:'number', align:'right', width:70, minWidth:70, headerSortTristate:true},
                        {title:'Pay', field:'pay', formatter:'money', formatterParams:{ symbol:'$' }, width:60, minWidth:60, headerSortTristate:true},
                        {title:'Reject %', field:'rejects', align:'right', sorter:'number', width:90, minWidth:90, headerSortTristate:true},
                        {title:'Last Seen', field:'last_seen', sorter:'datetime', align:'right', sorterParams:{ format:'hh:mm - MM-DD-YYYY'}, width:130, minWidth:100, headerSortTristate:true}
                    ],
                    initialSort:[{column:'last_seen', dir:'desc'}],
                    rowDblClick: (evt, row) => {
                        window.getSelection().removeAllRanges();
                        this.app.onOpenRequester(row.getData().id, true);
                    },
                    rowContext: (evt, row) => {
                        evt.preventDefault();
                        this.app.onShowInfo(row.getData(), true);
                    },
                    rowFormatter: (row) => { row.getElement().setAttribute('tag', row.getData().tag); }
                });

                this.tables.push(this.table);
                this.showHistory();
            }

            async showHistory() {
                let history = await (await fetch('/history/')).json();
                this.table.replaceData(history);
                this.panel.setHeaderTitle(`History (${history.length} entries)`);
                this.table.redraw();
            }

        }


        class MessagesPanel extends childPanel {
            constructor(app, showAll) {
                super({
                    headerTitle: 'Messages',
                    id: 'messagesPanel',
                    position: {
                        my: 'center-bottom',
                        at: 'center-bottom',
                        of: 'window',
                        offsetY: -100
                    },
                    contentSize: {
                        width: Math.floor(window.innerWidth * 0.98),
                        height: Math.floor(window.innerHeight * 0.125)
                    },
                });
                this.app = app;
                this.showAll = showAll;
                this.newMessageIds = new Set();
                if (showAll) {
                    this.showAllMessages();
                }
                else {
                    this.showNewMessages();
                }

            }

            setupContent(panel) {
                panel.content.innerHTML = `<div class='contentHolder'>
                <div class='tableHolder'>Message table goes here.</div>
                </div>`;

                this.table = new Tabulator(panel.content.querySelector('div.tableHolder'), {
                    layout:'fitColumns',
                    selectable: false,
                    columns: [
                        {title:'New', field:'is_new', formatter: this.formatIsNew, sorter:'string',width: 50, headerSortTristate:true},
                        {title:'When', field:'when', sorter:'datetime', sorterParams:{ format:'hh:mm / MM-DD-YYYY'}, width: 150, minWidth: 150, headerSortTristate:true},
                        {title:'Sender', field:'sender', sorter:'string', width: 150, minWidth: 120, headerSortTristate:true},
                        {title:'Message', field:'message', sorter:'string', minWidth: 120, headerSortTristate:true}
                    ],
                    rowFormatter: (row) => { this.formatByType(row); }
                });

                this.tables.push(this.table);
            }

            formatIsNew(cell, formatterParams, onRendered) {
                return cell.getRow().getData().is_new ? '✔️' : '';
            }

            formatByType(row) {
                row.getElement().setAttribute('tag', row.getData().type);
            }

            async showAllMessages() {
                let messages = await (await fetch('/messages/all')).json();
                this.displayMessages(messages);
            }

            async showNewMessages() {
                if (this.showAll) {
                    this.showAllMessages();
                }
                else {
                    let messages = await (await fetch('/messages/new')).json();
                    this.displayMessages(messages);
                }
            }

            displayMessages(messages) {
                this.newMessageIds = new Set();
                let tableData = [];
                for (let [id, msg] of Object.entries(messages)) {
                    if (msg.is_new) {
                        this.newMessageIds.add(id);
                    }
                    tableData.push(msg);
                }
                this.table.replaceData(tableData);
                this.table.redraw();
                let rows = this.table.getRows();
                if (rows.length) {
                    rows[rows.length - 1].scrollTo();
                }
            }

            destroyContent(panel, status) {
                while (this.tables.length) {
                    let tbl = this.tables.pop();
                    tbl.destroy();
                }
                if (this.menuId) {
                    ContextMenu.destroy(this.menuId);
                }
                this.app.onClosedMessagePanel(this.newMessageIds.keys());
                return true;
            }

        }


        class InfoPanel extends childPanel {
            constructor(group, app) {
                super({
                    headerTitle: 'Group Info',
                    id: 'infoPanel',
                    contentSize: {
                        width: Math.floor(window.innerWidth / 1.5),
                        height: 'auto'
                    }
                });
                this.group = group;
                this.app = app;
                this.fillContent();
            }

            setupContent(panel) {
                panel.content.innerHTML = `<div class='contentHolder row'>
                <div id="infoContent" style="white-space:pre-line"></div>
                <div class='tableHolder row'>Info table goes here.</div>
                </div>`;
            }

            fillContent() {
                this.table = new Tabulator(this.panel.content.querySelector('div.tableHolder'), {
                    layout:'fitColumns',
                    selectable: 'highlight',
                    columns: [
                        {title:'Qualification', field:'qual', sorter:'string', width: 300, widthGrow: 1, headerSortTristate:true},
                        {title:'Your Value', field:'worker_value', sorter:'string', width: 120, minWidth: 120, headerSortTristate:true},
                        {title:'Met', field:'meets_requirement', formatter: this.formatMeetsRequirements, sorter:'string', width: 50, headerSortTristate:true},
                        {title:'Qual Test', field:'qual_test_link', sorter:'string', headerSortTristate:true}
                    ],
                    rowDblClick: (evt, row) => {
                        window.getSelection().removeAllRanges();
                        let testLink = row.getData().qual_test_link;
                        if (testLink && !testLink.endsWith('request')) {
                            this.app.onOpenQualTest(testLink);
                        }
                    }
                });

                this.tables.push(this.table);

                let deadTime = moment().add(this.group.time_left, 'seconds').format('ddd, MMMM DD, h:mm a');
                document.getElementById('infoContent').innerHTML = `
                <div class="infoColumn centered">
                <span class="infoRequester lightgray">${this.group.requester}</span>
                <span class="infoTitle">${this.group.title}</span>
                <br>
                <span class="infoDescription lightgray">${this.group.description}</span>
                <br>
                <div class="infoProgress">
                <progress class="infoProgressBar" value="${this.group.count}" max="${this.group.max_seen}"></progress>
                <span class="infoProgressText">${this.group.count} \\ ${this.group.max_seen} HITs</span>
                </div>
                <br>
                <span class="infoDeadLabel">Estimated dead at: <span class="infoDeadTime lightgray">${deadTime}</span></span>
                </div>
                </p>
                Pay: $${this.group.pay.toFixed(2)}
                Rejects: ${this.group.rejects}%

                ID: ${this.group.id}
                Group: ${this.group.group_id}
                </p>
                `;

                this.table.replaceData(this.group.quals);
            }

            formatMeetsRequirements(cell, formatterParams, onRendered) {
                let meets_requirement = cell.getRow().getData().meets_requirement;
                return meets_requirement ? '✔️' : '❌';
            }

        }

        class IgnoreUntilPanel extends childPanel {
            constructor(groups) {
                super({
                    headerTitle: 'Ignore Until',
                    id: 'ignoreUntilPanel',
                    panelSize: {
                        width: 400,
                        height: 'auto'
                    },
                });
                this.groups = groups;
                this.fillContent();
            }

            setupContent(panel) {
                panel.content.innerHTML = `<div class='contentHolder'>
                <div id="ignoreUntilContent" class="infoColumn centered"></div>
                <div class='inputRow'>
                <span class="inputLable">HITs >:</span><input name="while_hits" type="number" min="0">
                </div>
                <div class="inputRow">
                <button id="ignoreUntilSave" class="mainWinButton">OK</button>
                <button id="ignoreUntilCancel" class="mainWinButton">Cancel</button>
                </div>
                </div>`;

                document.getElementById('ignoreUntilSave').onclick = () => this.onSave();
                document.getElementById('ignoreUntilCancel').onclick = () => panel.close();

            }

            fillContent() {
                let groups = this.groups;
                if (groups.length === 1) {
                    let group = groups[0];
                    document.getElementById('ignoreUntilContent').innerHTML = `
                    <span class="infoRequester">${group.requester}</span>
                    <span class="infoTitle lightgray">${group.title}</span>
                    <p>
                    ID: ${group.id}
                    <br>
                    Group: ${group.group_id}
                    </p>
                    `;
                }

                else {
                    document.getElementById('ignoreUntilContent').innerHTML = `
                    <h3>Ignoring ${groups.length} groups.</h3>
                    `;
                }

                let input = this.panel.content.querySelector(`input[name="while_hits"]`);

                input.value = Math.max(...(function*(grps=groups) {for (let grp of grps) { yield grp.count; } })()) + 1;
                input.focus();
                input.select();
            }

            async onSave() {
                let whileHits = this.panel.content.querySelector(`input[name="while_hits"]`);
                whileHits.setCustomValidity('');
                let ignorees = [];
                for (let group of this.groups) {
                    ignorees.push({group_id: group.group_id,
                        id: group.id,
                        requester: group.requester,
                        title: group.title,
                        while_hits: whileHits.value,
                        time_added: moment().toISOString(),
                        tag: group.tag
                    });
                }
                let errors = await (await fetch('/ignored/', {
                    method: 'POST',
                    body: JSON.stringify(ignorees),
                    headers:{ 'Content-Type': 'application/json' }
                })).json();
                if (Object.keys(errors).length === 0) {
                    this.panel.close();
                }
                else {
                    whileHits.setCustomValidity(errors.while_hits);
                    whileHits.reportValidity(errors.while_hits);
                }
            }
        }


        class HitSplit {
            init() {
                document.getElementById('monitoringButton').onclick = () => this.openMonitoringPanel();
                document.getElementById('blockButton').onclick = () => this.openBlockingPanel();
                document.getElementById('ignoredButton').onclick = () => this.openIgnoringPanel();
                document.getElementById('messagesButton').onclick = () => this.openMessagesPanel(true);
                document.getElementById('logButton').onclick = () => this.openLogPanel();
                document.getElementById('historyButton').onclick = () => this.openHistoryPanel();
                document.getElementById('treeview').onmousedown = (evt) => this.clickedTreeview(evt);
                this.pauseButton = document.getElementById('pauseButton');
                this.pauseButton.onclick = () => this.onPauseClick();
                this.alwaysAlarmButton = document.getElementById('alwaysAlarmButton');
                this.alwaysAlarmButton.onclick = () => this.onAlwaysAlarmClick();
                this.muteButton = document.getElementById('muteButton');
                this.muteButton.onclick = () => this.onMuteClick();

                this.mediaCurrentTime = document.getElementById('mediaCurrentTime');
                this.mediaProgressBar = document.getElementById('mediaProgressBar');
                this.mediaTitle = document.getElementById('mediaTitle');
                this.mediaTotalTime = document.getElementById('mediaTotalTime');
                this.statusText = document.getElementById('statusText');
                this.computerStatus = document.getElementById('computerStatus');

                this.paused = false;
                this.alwaysAlarm = false;
                this.muted = false;
                this.numNewMessages = 0;
                this.updateUnpauseTimer = null;
                this.mouseleaveIgnoreClasses = new Set(['ctxmenu', 'jsPanel']);
                this.syncId = 0;
                this.lastUpdateTime = Date.now();
                this.lastMouseMove = {
                    time: 0,
                    x: 0,
                    y: 0
                };

                this.treeGroups = [
                    {id:'active_requesters', requester:'Active Requesters', title:'▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
                    count:'▬▬▬▬', pay:'▬▬▬▬', rejects:'▬▬▬▬', time_left:null, topLevel: true, _children:null, no_menu:true},
                    {id:'newest_hits', requester:'New HITs', title:'▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
                    count:'▬▬▬▬', pay:'▬▬▬▬', rejects:'▬▬▬▬', time_left:null, topLevel: true, _children:null, no_menu:true},
                    {id:'recent_hits', requester:'Recent HITs', title:'▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
                    count:'▬▬▬▬', pay:'▬▬▬▬', rejects:'▬▬▬▬', time_left:null, topLevel: true, _children:null, no_menu:true},
                    {id:'batch_hits', requester:'Batch HITs', title:'▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
                    count:'▬▬▬▬', pay:'▬▬▬▬', rejects:'▬▬▬▬', time_left:null, topLevel: true, _children:null, no_menu:true}
                ];

                this.expandedRows = new Set(['active_requesters', 'newest_hits']);
                this.displayedActives = new Set();
                this.collapsedActives = new Set();
                this.table = this.createTable(this);

                this.hoveredRow = null;
                this.selectedRows = [];
                this.menuItems = [
                    {
                        text: 'Show Info',
                        disabled: false,
                        enabledWhen: [MENU_TOGGLES.SINGLE_ALWAYS],
                        action: () => this.onShowInfo(this.table.getSelectedData()[0])
                    },
                    {
                        text: 'T.O.',
                        disabled: false,
                        enabledWhen: [MENU_TOGGLES.SINGLE_ALWAYS],
                        action: () => this.onOpenTo(this.table.getSelectedData()[0].id)
                    },
                    {
                        text: 'Old T.O.',
                        disabled: false,
                        enabledWhen: [MENU_TOGGLES.SINGLE_ALWAYS],
                        action: () => this.onOpenOldTo(this.table.getSelectedData()[0].id)
                    },
                    { isDivider: true },
                    {
                        text: 'Ignore Until',
                        disabled: false,
                        enabledWhen: [MENU_TOGGLES.ALWAYS],
                        action: () => this.onIgnoreUntil(this.table.getSelectedData())
                    },
                    {
                        text: 'Edit Monitoring',
                        disabled: false,
                        enabledWhen: [MENU_TOGGLES.MONITORED],
                        action: () => this.onEditMonitoring(this.table.getSelectedData()[0])
                    },
                    { isDivider: true },
                    {
                        text: 'Monitor Requester',
                        disabled: false,
                        enabledWhen: [MENU_TOGGLES.UNMONITORED],
                        action: () => this.onMonitor(this.table.getSelectedData()[0])
                    },
                    {
                        text: 'Blocking',
                        disabled: false,
                        enabledWhen: [MENU_TOGGLES.SINGLE_ALWAYS],
                        action: () => this.onBlock(this.table.getSelectedData()[0])
                    }
                ];
                this.syncMap = {
                    status_text: (data) => this.updateStatus(data),
                    computer_status: (data) => this.updateComputerStatus(data),
                    media_status: (data) => this.updateMediaStatus(data),
                    backend_state: (data) => this.updateButtonStates(data),
                    displayed_hits: (data) => this.updateDisplayedHits(data),
                    num_new_messages: (data) => this.updateMessages(data),
                    close_messages: () => this.closeMessagePanel()
                };

                ContextMenu.attach('#treeview', this.menuItems, (menu, evt) => this.showTableContextMenu(menu, evt));
                let treeview = document.getElementById('treeview');
                treeview.addEventListener('mousemove', (evt) => {
                    let totalMovement = Math.abs(evt.x - this.lastMouseMove.x) + Math.abs(evt.y - this.lastMouseMove.y);
                    if (totalMovement > IGNORE_SHORT_MOUSE_MOVES_PX) {
                        this.lastMouseMove.time = Date.now();
                        this.lastMouseMove.x = evt.x;
                        this.lastMouseMove.y = evt.y;
                    }
                });
                treeview.addEventListener('mouseleave', (evt) => {
                    let newElement = evt.toElement || evt.relatedTarget;
                    if (newElement === null || newElement.nodeName === 'BODY' || !ancestorHasClass(newElement, this.mouseleaveIgnoreClasses)) {
                        this.undoSoftPause();
                    }
                });
                this.evtSource = new ReconnectingEventSource(HS_URL_PREFIX + '/sync/eventsource/', {max_retry_time: 5000});
                this.evtSource.addEventListener('SYNC', async (evt) => {
                    this.lastUpdateTime = Date.now();
                    let data = JSON.parse(evt.data);
                    for (let key of Object.keys(data)) {
                        this.syncMap[key](data[key]);
                    }
                });
                this.evtSource.addEventListener('open', async (evt) => {
                    await fetch('/resync/', {
                        method: 'POST',
                        headers:{ 'Content-Type': 'application/json' }
                    });
                });
                this.evtSource.addEventListener('error', (error) => {
                    this.updateStatus('Could not connect to backend', true);
                });
                setTimeout(async () => {
                    if ((Date.now() - this.lastUpdateTime) > 900000) {
                        this.updateStatus('Backend not updating!', true);
                        /*await fetch(ALARM_URL, {
                            method: 'POST',
                            body: JSON.stringify( { say: 'Hit Split backend not updating!', repeats: 2 } ),
                            headers:{ 'Content-Type': 'application/json' }
                        });*/
                    }
                }, 900000);
            }

            updateStatus(status, isError=false) {
                this.statusText.textContent = status;
                if (!isError) {
                    this.statusText.removeAttribute('class');
                }
                else {
                    this.statusText.setAttribute('class', 'error');
                }
            }

            updateComputerStatus(status) {
                this.computerStatus.textContent = status;
            }

            updateMediaStatus(status) {
                this.mediaCurrentTime.textContent = status.current_time;
                this.mediaTotalTime.textContent = status.total_time;
                this.mediaTitle.textContent = status.title;
                this.mediaProgressBar.value = status.progress;
            }

            updateDisplayedHits(updateData) {
                if (Date.now() - this.lastMouseMove.time < 5000) {
                    return;
                }

                this.syncId = updateData.sync_id;
                let hits = updateData.hits;
                for (let parentRow of this.treeGroups) {
                    parentRow._children = hits[parentRow.id].length ? hits[parentRow.id] : null;
                }
                let actives = new Set();
                for(let requester of hits.active_requesters) {
                    actives.add(requester.id);
                }
                for (let requester of setDifference(this.displayedActives, actives).keys()) {
                    this.collapsedActives.delete(requester);
                    this.expandedRows.delete(requester);
                }

                this.displayedActives = actives;
                for (let requester of this.displayedActives.keys()) {
                    if (!this.collapsedActives.has(requester)) {
                        this.expandedRows.add(requester);
                    }
                }

                this.table.replaceData(this.treeGroups).then(()=> this.table.redraw());
            }

            updateButtonStates(backendState) {
                if (backendState.paused) {
                    this.pauseButton.classList.add('red');
                    this.pauseButton.textContent = 'Resume';
                    this.paused = true;
                }
                else {
                    this.pauseButton.classList.remove('red');
                    this.pauseButton.textContent = 'Pause';
                    this.paused = false;
                }
                if (backendState.always_alarm) {
                    this.alwaysAlarmButton.classList.add('activated');
                    this.alwaysAlarmButton.textContent = 'Limit Alarms';
                    this.alwaysAlarm = true;
                }
                else {
                    this.alwaysAlarmButton.classList.remove('activated');
                    this.alwaysAlarmButton.textContent = 'Always Alarm';
                    this.alwaysAlarm = false;
                }
                if (backendState.muted) {
                    this.muteButton.classList.add('activated');
                    this.muteButton.textContent = 'Unmute';
                    this.muted = true;
                }
                else {
                    this.muteButton.classList.remove('activated');
                    this.muteButton.textContent = 'Mute';
                    this.muted = false;
                }
            }

            updateMessages(numNewMessages) {
                this.numNewMessages = numNewMessages;
                if (numNewMessages !== 0) {
                    document.title = `${APP_TITLE} - New Messages`;
                    this.openMessagesPanel(false);
                }
            }

            checkPanelOpen(panelID) {
                return Boolean(document.getElementById(panelID));
            }

            createTable() {
                return new Tabulator('#treeview', {
                    dataTree:true,
                    dataTreeStartExpanded:(row, level) => { return this.expandedRows.has(row.getData().id); },
                    dataTreeExpandElement:'<span class="expandElement">⮞</span>',
                    dataTreeCollapseElement:'<span class="expandElement">⮟</span>',
                    dataTreeBranchElement:false,
                    dataTreeRowExpanded: (row, level) => { this.onExpandRow(row, level); },
                    dataTreeRowCollapsed: (row, level) => { this.onCollapseRow(row, level); },
                    data: this.treeGroups,
                    //height:'100%',
                    reactiveData: false,
                    layout:'fitColumns',
                    selectable: true,
                    selectableRangeMode: 'click',
                    selectableCheck: (row) => { return !row.getData().topLevel; },
                    rowMouseEnter: (evt, row) => { this.onRowMouseEnter(row, this); },
                    rowMouseLeave: (evt, row) => { this.onRowMouseLeave(row, this); },
                    rowFormatter: (row) => { row.getElement().setAttribute('tag', row.getData().tag); },
                    rowDblClick: (evt, row) => {
                        window.getSelection().removeAllRanges();
                        let data = row.getData();
                        if (!data.topLevel && !data.is_requester) {
                            this.onOpenRequester(data.id);
                        }
                    },
                    columns: [
                        {title:'Requester', field:'requester', sorter:'string', width:200, headerSort:false},
                        {title:'Title', field:'title', formatter: this.formatTitle, sorter:'string', minWidth:200, headerSortTristate:true},
                        {title:'Count', field:'count', sorter:'number', align:'right', width:70, minWidth:70, headerSortTristate:true},
                        {title:'Pay', field:'pay', formatter:'money', formatterParams:{ symbol:'$' }, width:60, minWidth:60, headerSortTristate:true},
                        {title:'Reject %', field:'rejects', align:'right', sorter:'number', width:90, minWidth:90, headerSortTristate:true},
                        {title:'Time Left', field:'time_left', formatter: this.formatTimeLeft, sorter:'time', align:'right', sorterParams:{ format:'hh[h] mm[m]'}, width:82, minWidth:82, headerSortTristate:true}
                    ]
                });
            }

            formatTitle(cell, formatterParams, onRendered) {
                let data = cell.getRow().getData();
                if (data.topLevel || data.hovered) {
                    return data.title;
                }
                return data.title.length <= DEFAULT_TITLE_WIDTH ? data.title : data.title.slice(0, DEFAULT_TITLE_WIDTH) + '…';
            }

            formatTimeLeft(cell, formatterParams, onRendered) {
                let data = cell.getRow().getData();
                if (data.hovered || (data.tag !== 'normal' && !data.topLevel)) {
                    if (data.time_left === null) {
                        return '?';
                    }
                    let hours = data.time_left / 3600;
                    let minutes = Math.floor((hours*60) % 60);
                    return `${Math.floor(hours)}h ${minutes.toString().padStart(2, '0')}m`;
                }
                else if (data.topLevel) {
                    return '▬▬▬▬';
                }
                return '?';
            }

            onExpandRow(row, level) {
                let rowId = row.getData().id;
                this.expandedRows.add(rowId);
                if (level === 1) {
                    this.collapsedActives.delete(rowId);
                }
            }

            onCollapseRow(row, level) {
                let rowId = row.getData().id;
                if (rowId === 'active_requesters') {
                    row.treeExpand();
                    return;
                }
                this.expandedRows.delete(rowId);
                if (level === 1) {
                    this.collapsedActives.add(rowId);
                }
            }

            onRowMouseEnter(row) {
                let data = row.getData();
                if (data.topLevel || data.is_requester || this.treeviewMenuOpen()) {
                    return;
                }
                this.hoveredRow = row;
                this.hoveredRowData = data;
                data.hovered = true;
                let cell = row.getCell('title');
                cell.setValue(cell.getValue());
                cell = row.getCell('time_left');
                cell.setValue(cell.getValue());
            }

            onRowMouseLeave(row) {
                this.hoveredRow = null;
                this.hoveredRowData = null;
                delete row.getData().hovered;
                let cell = row.getCell('title');
                cell.setValue(cell.getValue());
                cell = row.getCell('time_left');
                cell.setValue(cell.getValue());
            }

            undoSoftPause() {
                this.lastMouseMove.time = 0;
                this.refreshTreeview();
            }

            showTableContextMenu(menu, event) {
                this.lastMouseMove.time = Date.now();
                let selected = this.table.getSelectedRows();
                if (selected.length <= 1 && this.hoveredRow && !this.hoveredRowData.no_menu) {
                    this.table.deselectRow();
                    this.table.selectRow(this.hoveredRow);
                    this.selectedRows = [this.hoveredRow];
                    for (let item of this.menuItems) {
                        if (!item.enabledWhen) {
                            continue;
                        }
                        if (item.enabledWhen.includes(MENU_TOGGLES.NEVER)) {
                            item.disabled = true;
                        }
                        else if (item.enabledWhen.includes(MENU_TOGGLES.ALWAYS) ||
                        item.enabledWhen.includes(MENU_TOGGLES.SINGLE_ALWAYS) ||
                        (this.hoveredRowData.monitoring_type !== MONITORING_MODES.UNMONITORED && item.enabledWhen.includes(MENU_TOGGLES.MONITORED)) ||
                        (this.hoveredRowData.monitoring_type === MONITORING_MODES.UNMONITORED && item.enabledWhen.includes(MENU_TOGGLES.UNMONITORED))) {
                            item.disabled = false;
                        }
                        else {
                            item.disabled = true;
                        }
                    }
                }
                else if (selected.length >= 2) {
                    for (let item of this.menuItems) {
                        if (!item.enabledWhen) {
                            continue;
                        }
                        if (item.enabledWhen.includes(MENU_TOGGLES.ALWAYS)) {
                            item.disabled = false;
                        }
                        else {
                            item.disabled = true;
                        }
                    }
                }
                else {
                    this.table.deselectRow();
                    return [];
                }
                return this.menuItems;
            }

            clickedTreeview(evt) {
                if(evt.which === 2) {
                    if (this.treeviewMenuOpen()) {
                        return;
                    }
                    evt.preventDefault();
                    this.ignoreGroups();
                }
            }

            treeviewMenuOpen() {
                return document.querySelectorAll('ul.ctxmenu:not([style*="display"])').length !== 0;
            }

            async ignoreGroups() {
                if (this.treeviewMenuOpen()) {
                    return;
                }
                let ignorees = [];
                let selected = this.table.getSelectedRows();
                if (selected.length <= 1) {
                    if (this.hoveredRow && !this.hoveredRowData.topLevel) {
                        selected = [this.hoveredRow];
                    }
                    else {
                        return;
                    }
                }

                for (let row of selected) {
                    let data = row.getData();
                    if (!data.no_menu) {
                        ignorees.push({group_id: data.group_id,
                            id: data.id,
                            requester: data.requester,
                            title: data.title,
                            while_hits: null,
                            time_added: moment().format(),
                            tag: data.tag
                        });
                        data.no_menu = true;
                        row.getElement().setAttribute('tag', 'ignored');
                    }
                }
                await fetch('/ignored/', {
                    method: 'POST',
                    body: JSON.stringify(ignorees),
                    headers:{ 'Content-Type': 'application/json' }
                });
                this.table.deselectRow();
            }

            openMonitoringPanel() {
                if (this.checkPanelOpen('monitoringPanel')) {
                    return;
                }
                new MonitoringPanel();
            }

            openBlockingPanel() {
                if (this.checkPanelOpen('blockingPanel')) {
                    return;
                }
                new BlockingPanel();
            }

            openIgnoringPanel() {
                if (this.checkPanelOpen('ignoringPanel')) {
                    return;
                }
                new IgnoringPanel();
            }

            openMessagesPanel(showAll) {
                if (this.checkPanelOpen('messagesPanel')) {
                    if (showAll) {
                        this.messagesPanel.showAllMessages();
                    }
                    else {
                        this.messagesPanel.showNewMessages();
                    }
                }
                else {
                    this.messagesPanel = new MessagesPanel(this, showAll);
                }
            }

            async onClosedMessagePanel(messageIds) {
                document.title = APP_TITLE;
                await fetch('/messages/seen', {
                    method: 'POST',
                    body: JSON.stringify([...messageIds]),
                    headers:{ 'Content-Type': 'application/json' }
                });
            }

            closeMessagePanel() {
                if (this.messagesPanel) {
                    this.messagesPanel.panel.close();
                }
                this.messagesPanel = null;
            }

            openLogPanel() {
                if (this.checkPanelOpen('logPanel')) {
                    return;
                }
                new LogPanel();
            }

            openHistoryPanel() {
                if (this.checkPanelOpen('historyPanel')) {
                    return;
                }
                new HistoryPanel(this);
            }

            async refreshTreeview() {
                await fetch('/refresh/', {
                    method: 'POST',
                    body: JSON.stringify([this.syncId]),
                    headers:{ 'Content-Type': 'application/json' }
                });
            }

            async onPauseClick() {
                await fetch('/toggle/', {
                    method: 'POST',
                    body: JSON.stringify(['paused']),
                    headers:{ 'Content-Type': 'application/json' }
                });
            }

            async onAlwaysAlarmClick() {
                await fetch('/toggle/', {
                    method: 'POST',
                    body: JSON.stringify(['always_alarm']),
                    headers:{ 'Content-Type': 'application/json' }
                });
            }

            async onMuteClick() {
                await fetch('/toggle/', {
                    method: 'POST',
                    body: JSON.stringify(['muted']),
                    headers:{ 'Content-Type': 'application/json' }
                });
            }

            onShowInfo(groupsData, fromPanel=false) {
                if (!this.table.getSelectedRows().length && !fromPanel) {
                    return;
                }
                if (this.checkPanelOpen('infoPanel')) {
                    return;
                }
                new InfoPanel(groupsData, this);
            }

            onIgnoreUntil(groupData) {
                if (!this.table.getSelectedRows().length) {
                    return;
                }
                if (this.checkPanelOpen('ignoreUntilPanel')) {
                    return;
                }
                new IgnoreUntilPanel(groupData);
            }

            async onMonitor(rowData) {
                if (!this.table.getSelectedRows().length) {
                    return;
                }
                this.updateStatus(`Added ${rowData.requester} to monitoring.`);
                return await (await fetch('/monitored/', {
                    method: 'POST',
                    body: JSON.stringify(Object.assign({}, rowData, {
                        monitoring_type: MONITORING_MODES.PASSIVE,
                        min_hits: DEFAULT_MIN_HITS,
                        title_match: '',
                        title_exclude: '',
                        description_match: '',
                        description_exclude: '',
                        external_alarm_enabled: true,
                        alarms: []
                    })),
                    headers:{ 'Content-Type': 'application/json' }
                })).json();
            }

            onEditMonitoring(rowData) {
                if (!this.table.getSelectedRows().length) {
                    return;
                }
                if (rowData.monitoring_type !== MONITORING_MODES.UNMONITORED && this.checkPanelOpen('monitoringPanel')) {
                    return;
                }
                new MonitoringPanel(rowData.id);
            }

            onBlock(rowData) {
                if (!this.table.getSelectedRows().length) {
                    return;
                }
                if (this.checkPanelOpen('blockingPanel')) {
                    return;
                }
                new BlockingPanel(rowData.id, rowData.requester);
            }

            async onOpenRequester(requesterId, fromPanel=false) {
                if (!this.table.getSelectedRows().length && !fromPanel) {
                    return;
                }
                await fetch('/open_page/requester', {
                    method: 'POST',
                    body: JSON.stringify({id: requesterId}),
                    headers:{ 'Content-Type': 'application/json' }
                });
                this.table.deselectRow();
            }

            async onOpenQualTest(testLink) {
                let qualId = /\/qualifications\/(.*?)(?:\/|$)/.exec(testLink)[1];
                await fetch('/open_page/qualification', {
                    method: 'POST',
                    body: JSON.stringify({id: qualId}),
                    headers:{ 'Content-Type': 'application/json' }
                });
            }

            async onOpenTo(requesterId, fromPanel=false) {
                if (!this.table.getSelectedRows().length && !fromPanel) {
                    return;
                }
                await fetch('/open_page/to', {
                    method: 'POST',
                    body: JSON.stringify({id: requesterId}),
                    headers:{ 'Content-Type': 'application/json' }
                });
                this.table.deselectRow();
            }

            async onOpenOldTo(requesterId, fromPanel=false) {
                if (!this.table.getSelectedRows().length && !fromPanel) {
                    return;
                }
                await fetch('/open_page/old_to', {
                    method: 'POST',
                    body: JSON.stringify({id: requesterId}),
                    headers:{ 'Content-Type': 'application/json' }
                });
                this.table.deselectRow();
            }

        }


        function setDifference(setA, setB) {
            'use strict';
            var _difference = new Set(setA);
            for (var elem of setB) {
                _difference.delete(elem);
            }
            return _difference;
        }

        function uuidv4() {
            'use strict';
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        }

        function ancestorHasClass(node, targetClasses) {
            'use strict';
            while (node !== null) {
                for (let parentClass of node.classList || []) {
                    if (targetClasses.has(parentClass)) {
                        return true;
                    }
                }
                node = node.parentNode;
            }
            return false;
        }


        document.addEventListener('DOMContentLoaded', () => {
            'use strict';
            let hs = new HitSplit();
            hs.init();
        }, false);
