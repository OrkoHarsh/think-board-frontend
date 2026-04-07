const BASE = 'https://api.iconify.design';

export const getIconUrl = (iconKey) => {
    if (!iconKey || !iconKey.includes(':')) return null;
    const [prefix, name] = iconKey.split(':');
    // MDI icons are monochrome — inject a dark colour so they render visibly
    const color = prefix === 'mdi' ? '?color=%23374151' : '';
    return `${BASE}/${prefix}/${name}.svg${color}`;
};

export const ICON_CATEGORIES = [
    {
        label: 'Databases',
        icons: [
            { key: 'logos:postgresql', label: 'PostgreSQL' },
            { key: 'logos:mysql',      label: 'MySQL'      },
            { key: 'logos:mongodb',    label: 'MongoDB'    },
            { key: 'logos:redis',      label: 'Redis'      },
            { key: 'logos:elasticsearch', label: 'Elasticsearch' },
            { key: 'logos:cassandra',  label: 'Cassandra'  },
            { key: 'logos:couchdb',    label: 'CouchDB'    },
            { key: 'logos:sqlite',     label: 'SQLite'     },
        ],
    },
    {
        label: 'Messaging',
        icons: [
            { key: 'logos:apache-kafka', label: 'Kafka'     },
            { key: 'logos:rabbitmq',     label: 'RabbitMQ'  },
            { key: 'logos:aws-sqs',      label: 'SQS'       },
            { key: 'logos:aws-sns',      label: 'SNS'       },
            { key: 'logos:nats-icon',    label: 'NATS'      },
        ],
    },
    {
        label: 'Compute',
        icons: [
            { key: 'logos:docker-icon',  label: 'Docker'     },
            { key: 'logos:kubernetes',   label: 'Kubernetes' },
            { key: 'logos:nginx',        label: 'Nginx'      },
            { key: 'logos:apache',       label: 'Apache'     },
            { key: 'logos:aws-ec2',      label: 'EC2'        },
            { key: 'logos:aws-lambda',   label: 'Lambda'     },
            { key: 'logos:aws-fargate',  label: 'Fargate'    },
        ],
    },
    {
        label: 'Networking',
        icons: [
            { key: 'logos:cloudflare',       label: 'Cloudflare'  },
            { key: 'logos:aws-cloudfront',   label: 'CloudFront'  },
            { key: 'logos:aws-route53',      label: 'Route 53'    },
            { key: 'logos:aws-api-gateway',  label: 'API Gateway' },
            { key: 'logos:aws-vpc',          label: 'VPC'         },
        ],
    },
    {
        label: 'Storage',
        icons: [
            { key: 'logos:aws-s3',              label: 'S3'        },
            { key: 'logos:aws-glacier',         label: 'Glacier'   },
            { key: 'logos:google-cloud-storage',label: 'GCS'       },
            { key: 'logos:aws-efs',             label: 'EFS'       },
        ],
    },
    {
        label: 'Cloud',
        icons: [
            { key: 'logos:aws',               label: 'AWS'          },
            { key: 'logos:google-cloud',      label: 'GCP'          },
            { key: 'logos:microsoft-azure',   label: 'Azure'        },
            { key: 'logos:digitalocean',      label: 'DigitalOcean' },
            { key: 'logos:heroku-icon',       label: 'Heroku'       },
            { key: 'logos:vercel-icon',       label: 'Vercel'       },
        ],
    },
    {
        label: 'Monitoring',
        icons: [
            { key: 'logos:grafana',       label: 'Grafana'    },
            { key: 'logos:prometheus',    label: 'Prometheus' },
            { key: 'logos:datadog',       label: 'Datadog'    },
            { key: 'logos:sentry-icon',   label: 'Sentry'     },
            { key: 'logos:elastic',       label: 'Elastic'    },
        ],
    },
    {
        label: 'Generic',
        icons: [
            { key: 'mdi:server',             label: 'Server'        },
            { key: 'mdi:database',           label: 'Database'      },
            { key: 'mdi:cloud-outline',      label: 'Cloud'         },
            { key: 'mdi:api',                label: 'API'           },
            { key: 'mdi:cellphone',          label: 'Client'        },
            { key: 'mdi:web',                label: 'Browser'       },
            { key: 'mdi:account-multiple',   label: 'Users'         },
            { key: 'mdi:shield-lock-outline',label: 'Auth'          },
            { key: 'mdi:cached',             label: 'Cache'         },
            { key: 'mdi:tray-full',          label: 'Queue'         },
            { key: 'mdi:dns-outline',        label: 'DNS'           },
            { key: 'mdi:network-outline',    label: 'Network'       },
            { key: 'mdi:cog-outline',        label: 'Service'       },
            { key: 'mdi:gate',               label: 'Load Balancer' },
            { key: 'mdi:file-document-outline', label: 'CDN'        },
            { key: 'mdi:lock-outline',       label: 'Firewall'      },
        ],
    },
];

export const getAllIcons = () => ICON_CATEGORIES.flatMap((c) => c.icons);
