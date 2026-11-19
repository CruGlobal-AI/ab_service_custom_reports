/**
 * tl-reports-email-all
 * Email every Team Leader the "RC Balances" and "Budget vs. Actual" reports
 * of a closed fiscal month (the work is in reports/tlReportsEmail.js).
 *
 * Called by the TLReportsEmail process task (process_manager) when a Fiscal
 * Month is set to Closing. It replies right away with the number of Team
 * Leaders, then sends the emails one after another in the background. A
 * reply that waited for every PDF could time out and be sent again, which
 * would email everyone twice. A TL that fails is skipped.
 */
import ABBootstrap from "../AppBuilder/ABBootstrap.js";
import {
   loadTeamLeaders,
   sendAllTlReports,
} from "../reports/tlReportsEmail.js";

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
    *        the request object sent by process_manager
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: async function handler(req, cb) {
      const fyPeriod = req.param("fyPeriod");
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

      const { sent, skipped } = await sendAllTlReports(AB, req, leaders, {
         fyPeriod,
         sendTo: req.param("sendTo"),
         from: req.param("from"),
      });
      req.log(
         `tl-reports-email-all: ${fyPeriod} done, ${sent} sent, ${skipped} skipped`,
      );
   },
};
