const { Resource } = require('@google-cloud/resource');
const { Storage } = require('@google-cloud/storage');
const Compute = require('@google-cloud/compute');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.helloPubSub = async (event, _context) => {
  const message = event.data
    ? Buffer.from(event.data, 'base64').toString()
    : `Inventory disks, check for backup schedules, and create a default schedule if required.`;
  console.log(message);
  
  /**
   * Get the project id of running context
   * 
   * @returns 
   */
  async function getProjectId() {
    const compute = new Compute();
    const thisPrj = compute.project();
    const prjData = await thisPrj.get();
    return prjData[0].metadata.name;
  }

  /**
   * Generate a timestamp
   * 
   * @returns 
   */
  function getTimeStamp() {
    const moment = require('moment');
    const format = "YYYYMMDD-HHmmss"
    const date = Date.now();
    return moment(date).format(format);
  }

  /**
   * Generate the filename from the timestamp
   * 
   * @returns 
   */
  function getObjectFilename() {
    return `${getTimeStamp()}.json`;
  }

  /**
   * Save some JSON (our project inventory) to the specified filename
   * 
   * @returns
   */
  async function saveProjectInventoryToObject(projectInventory, fileName) {
    const storage = new Storage();
    const project_id = await getProjectId();
    const bucketname = `project_records_${project_id}`;
    const myBucket = storage.bucket(bucketname);
    const file = myBucket.file(fileName);
    await file.save(JSON.stringify(projectInventory, undefined, 2));  
  }

  /**
   * Save our project inventory
   * 
   * @returns
   */ 
  async function saveProjectInventoryToTimestampFilenameObject(project_inventory_details) {
    const fileName = getObjectFilename();
    await saveProjectInventoryToObject(project_inventory_details, fileName);
    return fileName;
  }

  /**
   * Create an html table from a list of projects
   * 
   * @param {*} project_list 
   * @returns 
   */
  function createTable(project_list) {
    return `
      <table style="border: 1px solid black; border-spacing: 0; border-collapse: collapse;">
        <tr>
          <th style="border: 1px solid black; border-spacing: 0;">(index)</th>
          <th style="border: 1px solid black; border-spacing: 0;">id</th>
        </tr>${project_list.map( (row, i) => (`
        <tr>
          <td style="border: 1px solid black; border-spacing: 0;">${i}</td>
          <td style="border: 1px solid black; border-spacing: 0;">${row.id}</td>
        </tr>`)).join('')}
      </table>
    `;
  }

  /**
   * Object and functions to create HTML output for email
   * 
   */
  const html = {
    content: [],
    // add some text inside <p> tags </p>
    addParagraph: function(para) {
      this.content.push(`<p>${para}</p>`);
      return this;
    },
    // create an html table from list of disk details
    addTable: function(inventory_details) {
      this.content.push(createTable(inventory_details));
      return this;
    },
    // create an unordered list
    addUnorderedList: function(list) {
      this.content.push(`
        <ul>
        ${list.map(curr => (`
          <li>${JSON.stringify(curr)}</li>
        `))}
        </ul>
      `);
      return this;
    },
    // join list of html elements into a string
    join: function(token) {
      return this.content.join(token);
    }
  };

  async function getApiKey() {
    const secretManagerServiceClient = new SecretManagerServiceClient();
    const project_id = await getProjectId();
    const name = `projects/${project_id}/secrets/SENDGRID_API_KEY/versions/latest`;
    const [version] = await secretManagerServiceClient.accessSecretVersion({ name });
    return version.payload.data.toString();
  }
      
  /**
   * Send email
   * 
   * @param {*} html_content 
   */
  async function sendEmail(htmlContent) {
    const sgMail = require('@sendgrid/mail');
    
    if (true) {
      try {
        const msg = {
          to: 'justin@staubach.us',
          from: 'contact@jsdevtools.com',
          subject: 'Unmanaged Projects',
          html: htmlContent 
        };
        const sendgrid_api_key = await getApiKey();
        await sgMail.setApiKey(sendgrid_api_key);
        await sgMail.send(msg);
        console.log('Email sent');
      } catch (error) {
        console.error(error)
      }
    } else {
      console.log(`No disks missing backups. Skipping email notification.`);
    }
  }

  /**
   * Returns list of projects in accessible scope
   * 
   * @returns 
   */
  async function getProjectList() {
    const resource = new Resource();
    const [projects] = await resource.getProjects();
    console.log(`getProjectList: ${JSON.stringify(projects)}`);
    return projects.map(project => (project.metadata.projectId));
  }

  /**
   * Returns list of projects in active state
   * 
   * @param {*} projects 
   * @returns 
   */
  function getActiveProjectList(projects) {
    return projects.filter(project => (project.metadata.lifecycleState == 'ACTIVE'));
  }

  /**
   * Returns list of projects not in inactive state
   * 
   * @param {*} projects 
   * @returns 
   */
  function getInactiveProjectList(projects) {
    return projects.filter(project => (project.metadata.lifecycleState !== 'ACTIVE'));
  }

  /**
   * Returns list of active projects not in list of managed projects
   * 
   * @param {[string, ...]} activeProjects 
   * @param {[string, ...]} managedProjects 
   * @returns 
   */
  function getUnmanagedActiveProjectList(activeProjects, managedProjects) {
    return activeProjects.filter(project => (!managedProjects.includes(project)));
  }

  /**
   * Convert json to list of project_ids
   * 
   * @param {string} message_string 
   * @returns {[string,...]}
   */
  function getManagedProjectList(message_string) {
    const message_json = JSON.parse(message_string);
    return message_json.map(msg => (msg.id));
  }

  /*********
   * Start *
   *********/
  const projectList = await getProjectList();
  console.log(`all: ${JSON.stringify(projectList)}`);
  const inactiveProjectList = getInactiveProjectList(projectList);
  console.log(`inactive: ${JSON.stringify(inactiveProjectList)}`);
  const activeProjectList = getActiveProjectList(projectList);
  console.log(`active: ${JSON.stringify(activeProjectList)}`);
  const managedProjectList = getManagedProjectList(message);
  console.log(`managed: ${managedProjectList}`);
  const unmanagedProjectList = getUnmanagedActiveProjectList(activeProjectList, managedProjectList);
  console.log(`unmanaged: ${JSON.stringify(unmanagedProjectList)}`);

  const filename = await saveProjectInventoryToTimestampFilenameObject({
    projectList,
    inactiveProjectList,
    activeProjectList,
    unmanagedProjectList,
    managedProjectList,
  });

  const html_content = html
    .addParagraph(`Saved project inventory to: ${filename}`)
    .addParagraph(`Unmanaged projects:`)
    .addTable(unmanagedProjectList)
    .addParagraph(`All active projects:`)
    .addTable(activeProjectList)
    .join('');

  await sendEmail(html_content);
};
