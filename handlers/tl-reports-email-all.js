/**
 * tl-reports-email-all
 * Email every Team Leader the "RC Balances" and "Budget vs. Actual" reports
 * of a closed fiscal month (see tl-reports-email.js for one TL).
 *
 * Called by the "TL Finance Reports Email" process (an API task) when a
 * Fiscal Month is set to Closing. It replies right away with the number of
 * Team Leaders, then sends the emails one after another in the background,
 * so the process does not wait for every PDF. A TL that fails is skipped.
 */
import ABBootstrap from "../AppBuilder/ABBootstrap.js";
import { loadTeamLeaders, sendTlReports } from "./tl-reports-email.js";

export default {
   /**
    * Key: the cote message key we respond to.
    */
   key: "custom_reports.tl-reports-email-all",

   inputValidation: {
      // the closed fiscal month, ex "FY25 M06"
      fyPeriod: { string: true, required: true },
      // send every email here instead of to the TLs (testing)
      sendTo: { string: true, optional: true },
      from: { string: true, optional: true },
   },

   /**
    * fn
    * our Request handler.
    * @param {obj} req
    *        the request object sent by api_sails
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: async function handler(req, cb) {
      const fyPeriod = req.param("fyPeriod");
      const sendTo = req.param("sendTo");
      const from = req.param("from");
      req.log(`custom_reports.tl-reports-email-all: ${fyPeriod}`);

      let AB;
      let leaders;
      try {
         AB = await ABBootstrap.init(req);
         leaders = await loadTeamLeaders(AB);
      } catch (err) {
         cb(err);
         return;
      }

      cb(null, { status: "started", fyPeriod, teamLeaders: leaders.size });

      let sent = 0;
      let skipped = 0;
      for (const [username, teams] of leaders) {
         const result = await sendTlReports(AB, req, {
            username,
            fyPeriod,
            teams,
            sendTo,
            from,
         });
         if (result.status == "sent") sent++;
         else skipped++;
      }
      req.log(
         `tl-reports-email-all: ${fyPeriod} done, ${sent} sent, ${skipped} skipped`,
      );
   },
};
