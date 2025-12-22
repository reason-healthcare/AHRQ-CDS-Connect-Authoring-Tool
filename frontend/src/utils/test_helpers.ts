import _ from 'lodash';

interface Template {
  id?: string;
  conjunction?: boolean;
}

interface TemplateInstance extends Template {
  uniqueId: string;
  childInstances?: TemplateInstance[];
}

function createTemplateInstance(
  template: Template,
  children: TemplateInstance[] | undefined = undefined
): TemplateInstance {
  const instance = _.cloneDeep(template) as TemplateInstance;
  instance.uniqueId = _.uniqueId(instance.id);

  if (template.conjunction) {
    instance.childInstances = children || [];
  }

  return instance;
}

interface DataTransferEvent {
  dataTransfer: {
    files: File[];
    items: Array<{
      kind: string;
      size: number;
      type: string;
      getAsFile: () => File;
    }>;
    types: string[];
  };
}

function createDataTransferEventWithFiles(files: File[] = []): DataTransferEvent {
  return {
    dataTransfer: {
      files,
      items: files.map(file => ({
        kind: 'file',
        size: file.size,
        type: file.type,
        getAsFile: () => file
      })),
      types: ['Files']
    }
  };
}

interface CreateFileOptions {
  name: string;
  size: number;
  type: string;
  contents?: BlobPart[];
}

function createFile({ name, size, type, contents = [] }: CreateFileOptions): File {
  const file = new File(contents, name, { type });
  Object.defineProperty(file, 'size', {
    get() {
      return size;
    }
  });
  return file;
}

export { createTemplateInstance, createDataTransferEventWithFiles, createFile };
