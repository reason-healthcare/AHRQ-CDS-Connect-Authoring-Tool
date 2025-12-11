import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

const testMode = process.env.NODE_ENV === 'test';

interface Template {
  id?: string;
  conjunction?: boolean;
}

interface TemplateInstance extends Template {
  uniqueId: string;
  childInstances?: unknown[];
  [key: string]: unknown;
}

/**
 * Returns an instance with the given template and children and a unique id.
 * @param template - The event template to clone
 * @param children - Child instances to add to template instance
 */
export default function createTemplateInstance(template: Template, children?: unknown[]): TemplateInstance {
  // create an instance (copy) of the given template (ex. AND template)
  const instance = _.cloneDeep(template) as TemplateInstance;

  // add a unique id to the instance
  if (testMode) {
    // TODO: find a better way to implement this
    instance.uniqueId = `${instance.id}-TEST-1`;
  } else {
    instance.uniqueId = `${instance.id}-${uuidv4()}`;
  }

  // if the template has a conjunction, add the given children or an empty array
  if (template.conjunction) {
    instance.childInstances = children || [];
  }

  return instance;
}
