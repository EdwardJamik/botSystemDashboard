import "./telegramSending.css"

import SendingList from "./SendingList.jsx";
import React from "react";
import SendingListReport from "./SendingListReport.jsx";

export default function Sending() {
    return (
        <div className="telegram_users">
            <h3>Розсилка</h3>
            <SendingList/>
            <SendingListReport/>
        </div>
    )
}
